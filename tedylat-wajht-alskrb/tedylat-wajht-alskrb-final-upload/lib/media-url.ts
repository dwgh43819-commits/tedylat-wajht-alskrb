export type LinkErrorCode = 'invalid' | 'platform' | 'notMedia' | 'tooLarge' | 'failed'

export class LinkError extends Error {
  constructor(public code: LinkErrorCode) {
    super(code)
  }
}

const PLATFORM_HOSTS = [
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'fb.watch',
  'instagram.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'vimeo.com',
  'soundcloud.com',
  'spotify.com',
]

export function parseMediaUrl(input: string) {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    throw new LinkError('invalid')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new LinkError('invalid')
  const host = url.hostname.replace(/^www\.|^m\./, '')
  if (PLATFORM_HOSTS.some((p) => host === p || host.endsWith(`.${p}`))) throw new LinkError('platform')
  return url
}

const EXT_BY_TYPE: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/flac': 'flac',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
}

function fileNameFor(url: URL, type: string, disposition: string | null) {
  const fromHeader = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)?.[1]
  if (fromHeader) {
    try {
      return decodeURIComponent(fromHeader)
    } catch {
      return fromHeader
    }
  }
  const last = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '')
  if (/\.[a-z0-9]{2,5}$/i.test(last)) return last
  const ext = EXT_BY_TYPE[type.split(';')[0].trim().toLowerCase()] ?? 'mp4'
  return `${last || 'media'}.${ext}`
}

async function openStream(url: URL, signal: AbortSignal) {
  try {
    const direct = await fetch(url, { signal, mode: 'cors' })
    const type = direct.headers.get('content-type') ?? ''
    if (direct.ok && direct.body && !/^text\//i.test(type)) return { res: direct, finalUrl: new URL(direct.url || url) }
    await direct.body?.cancel()
  } catch (err) {
    if (signal.aborted) throw err
  }

  const res = await fetch(`/api/media-proxy?url=${encodeURIComponent(url.toString())}`, { signal })
  if (!res.ok || !res.body) {
    const code = (await res.json().catch(() => null))?.code as LinkErrorCode | undefined
    throw new LinkError(code === 'notMedia' || code === 'tooLarge' || code === 'invalid' ? code : 'failed')
  }
  return { res, finalUrl: new URL(res.headers.get('x-final-url') ?? url) }
}

export async function fetchMediaFromUrl(
  input: string,
  maxBytes: number,
  onProgress: (received: number, total: number) => void,
  signal: AbortSignal,
): Promise<File> {
  const url = parseMediaUrl(input)
  const { res, finalUrl } = await openStream(url, signal)

  const type = res.headers.get('content-type') ?? ''
  if (/^(text\/|application\/(json|xml|xhtml))/i.test(type)) {
    await res.body?.cancel()
    throw new LinkError('notMedia')
  }

  const total = Number(res.headers.get('content-length') ?? 0)
  if (total > maxBytes) {
    await res.body?.cancel()
    throw new LinkError('tooLarge')
  }

  const reader = res.body!.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) {
      await reader.cancel()
      throw new LinkError('tooLarge')
    }
    chunks.push(value)
    onProgress(received, total)
  }
  if (!received) throw new LinkError('failed')

  const disposition = res.headers.get('x-content-disposition') ?? res.headers.get('content-disposition')
  const cleanType = type.split(';')[0].trim() || 'application/octet-stream'
  return new File(chunks as BlobPart[], fileNameFor(finalUrl, type, disposition), { type: cleanType })
}
