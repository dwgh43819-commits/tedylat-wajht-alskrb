import { YoutubeTranscript } from 'youtube-transcript'

export type Segment = { start: number; text: string }

type CaptionTrack = { baseUrl: string; languageCode: string; kind?: string }

const ANDROID_VERSION = '20.10.38'

function decodeEntities(s: string) {
  let out = s
  for (let i = 0; i < 2; i++) {
    out = out
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&quot;/g, '"')
      .replace(/&apos;|&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
  }
  return out
}

function pickTrack(tracks: CaptionTrack[]) {
  const spoken = tracks.find((t) => t.kind === 'asr')?.languageCode
  if (spoken) {
    const base = spoken.split('-')[0]
    const manual = tracks.find((t) => t.kind !== 'asr' && t.languageCode.split('-')[0] === base)
    return manual ?? tracks.find((t) => t.kind === 'asr')!
  }
  return tracks[0]
}

async function fetchViaInnertube(id: string): Promise<Segment[]> {
  const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `com.google.android.youtube/${ANDROID_VERSION} (Linux; U; Android 14)`,
    },
    body: JSON.stringify({
      context: { client: { clientName: 'ANDROID', clientVersion: ANDROID_VERSION, androidSdkVersion: 34, hl: 'en' } },
      videoId: id,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`player ${res.status}`)
  const data = await res.json()
  const tracks: CaptionTrack[] = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  if (!tracks.length) throw new Error('no captions')

  const track = pickTrack(tracks)
  const url = new URL(track.baseUrl)
  url.searchParams.set('fmt', 'json3')
  const capRes = await fetch(url, { cache: 'no-store' })
  if (!capRes.ok) throw new Error(`captions ${capRes.status}`)
  const caps = await capRes.json()

  const segments: Segment[] = []
  for (const ev of caps?.events ?? []) {
    if (!ev.segs) continue
    const text = decodeEntities(ev.segs.map((s: { utf8?: string }) => s.utf8 ?? '').join(''))
      .replace(/\s+/g, ' ')
      .trim()
    if (text) segments.push({ start: (ev.tStartMs ?? 0) / 1000, text })
  }
  if (!segments.length) throw new Error('empty captions')
  return segments
}

async function fetchViaLibrary(id: string): Promise<Segment[]> {
  const items = await YoutubeTranscript.fetchTranscript(id)
  const segments = items
    .map((x) => ({
      start: x.offset > 10000 ? x.offset / 1000 : x.offset,
      text: decodeEntities(x.text).replace(/\s+/g, ' ').trim(),
    }))
    .filter((s) => s.text)
  if (!segments.length) throw new Error('empty captions')
  return segments
}

export async function fetchTranscript(id: string): Promise<Segment[] | null> {
  try {
    return await fetchViaInnertube(id)
  } catch {
    try {
      return await fetchViaLibrary(id)
    } catch {
      return null
    }
  }
}

export function formatTime(seconds: number) {
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${String(m).padStart(2, '0')}:${sec}`
}

export function groupLines(segments: Segment[], maxChars = 220) {
  const lines: { time: string; text: string }[] = []
  let start = segments[0]?.start ?? 0
  let buf = ''
  for (const seg of segments) {
    if (!buf) start = seg.start
    buf = buf ? `${buf} ${seg.text}` : seg.text
    if (buf.length >= maxChars || /[.!?؟]$/.test(seg.text) && buf.length >= 80) {
      lines.push({ time: formatTime(start), text: buf })
      buf = ''
    }
  }
  if (buf) lines.push({ time: formatTime(start), text: buf })
  return lines
}
