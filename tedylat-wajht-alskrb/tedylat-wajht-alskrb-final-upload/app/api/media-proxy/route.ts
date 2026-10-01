import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_BYTES = 2 * 1024 ** 3
const MAX_REDIRECTS = 4

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase()
    if (v === '::1' || v === '::') return true
    if (v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')) return true
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    return mapped ? isPrivateAddress(mapped[1]) : false
  }
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  )
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol')
  if (url.username || url.password) throw new Error('credentials')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) throw new Error('host')
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error('host')
}

const fail = (status: number, code: string) => Response.json({ code }, { status })

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('url')
  let target: URL
  try {
    target = new URL(raw ?? '')
  } catch {
    return fail(400, 'invalid')
  }

  let upstream: Response | null = null
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublicUrl(target)
      const res = await fetch(target, {
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TubeLens/1.0)', Accept: 'audio/*,video/*,*/*;q=0.5' },
        signal: request.signal,
      })
      const location = res.headers.get('location')
      if (res.status >= 300 && res.status < 400 && location) {
        await res.body?.cancel()
        target = new URL(location, target)
        continue
      }
      upstream = res
      break
    }
  } catch {
    return fail(400, 'invalid')
  }

  if (!upstream) return fail(502, 'failed')
  if (!upstream.ok || !upstream.body) {
    await upstream.body?.cancel()
    return fail(502, 'failed')
  }

  const type = upstream.headers.get('content-type') ?? ''
  if (/^(text\/|application\/(json|xml|xhtml))/i.test(type)) {
    await upstream.body.cancel()
    return fail(415, 'notMedia')
  }

  const length = Number(upstream.headers.get('content-length') ?? 0)
  if (length > MAX_BYTES) {
    await upstream.body.cancel()
    return fail(413, 'tooLarge')
  }

  const headers = new Headers({
    'Content-Type': type || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Final-Url': target.toString(),
  })
  if (length) headers.set('Content-Length', String(length))
  const disposition = upstream.headers.get('content-disposition')
  if (disposition) headers.set('X-Content-Disposition', disposition)

  return new Response(upstream.body, { status: 200, headers })
}
