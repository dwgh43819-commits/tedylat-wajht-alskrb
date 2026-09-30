import { parseVideoId } from '@/lib/demo-data'
import { fetchTranscript, formatTime, groupLines, type Segment } from '@/lib/transcript'

export const runtime = 'nodejs'
export const maxDuration = 300

const TEXT_MODELS = [process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'].filter(
  Boolean,
) as string[]

// Low-res "lite" models ingest long YouTube videos in seconds; full models can take minutes on hour-long videos.
const VIDEO_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash']

type Part =
  | { text: string }
  | { fileData: { fileUri: string }; videoMetadata?: { fps: number } }

type AskOptions = { models: string[]; json?: boolean; video?: boolean; timeoutMs?: number }

class FatalGeminiError extends Error {}

async function askGemini(parts: Part[], { models, json = false, video = false, timeoutMs = 120_000 }: AskOptions) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new FatalGeminiError('GEMINI_API_KEY is not configured on the server.')

  let lastError = 'Gemini request failed.'
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 65536,
            ...(json ? { responseMimeType: 'application/json' } : {}),
            ...(video ? { mediaResolution: 'MEDIA_RESOLUTION_LOW' } : {}),
          },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const text = (data.candidates?.[0]?.content?.parts ?? [])
          .filter((p: { thought?: boolean }) => !p.thought)
          .map((p: { text?: string }) => p.text ?? '')
          .join('')
        if (text.trim()) return text
        lastError = 'Gemini returned an empty response.'
        continue
      }
      lastError = data?.error?.message || lastError
      if ((res.status === 400 || res.status === 401 || res.status === 403) && /api key/i.test(lastError)) {
        throw new FatalGeminiError(lastError)
      }
    } catch (e) {
      if (e instanceof FatalGeminiError) throw e
      lastError = e instanceof Error ? (e.name === 'TimeoutError' ? 'Gemini took too long to respond.' : e.message) : lastError
    }
  }
  throw new Error(lastError)
}

function videoPart(id: string): Part {
  return { fileData: { fileUri: `https://www.youtube.com/watch?v=${id}` }, videoMetadata: { fps: 0.1 } }
}

function parseJson(t: string) {
  const cleaned = t.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned)
}

function languageName(code: unknown) {
  if (typeof code !== 'string' || !code) return 'Arabic'
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || 'Arabic'
  } catch {
    return 'Arabic'
  }
}

async function videoMeta(id: string) {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return null
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos')
  endpoint.searchParams.set('part', 'snippet')
  endpoint.searchParams.set('id', id)
  endpoint.searchParams.set('key', key)
  try {
    const r = await fetch(endpoint, { cache: 'no-store' })
    const d = await r.json()
    const s = d?.items?.[0]?.snippet
    return s ? { title: String(s.title ?? ''), description: String(s.description ?? ''), tags: (s.tags ?? []) as string[] } : null
  } catch {
    return null
  }
}

function toSeconds(stamp: string) {
  return stamp.split(':').map(Number).reduce((acc, n) => acc * 60 + (Number.isFinite(n) ? n : 0), 0)
}

const transcriptCache = new Map<string, Segment[]>()

async function geminiTranscript(id: string): Promise<Segment[]> {
  const cached = transcriptCache.get(id)
  if (cached) return cached

  const prompt = `Transcribe ALL speech in the attached video word for word, from the very beginning to the very end.
Rules:
- Keep the original spoken language and dialect exactly. Do NOT translate, summarize, paraphrase, or skip anything.
- Do not add descriptions of music, sounds, or visuals.
- Output plain text only, one line per 15-30 seconds of speech, each line formatted exactly as: [MM:SS] spoken words
- Use [H:MM:SS] after the first hour.`

  const raw = await askGemini([videoPart(id), { text: prompt }], { models: VIDEO_MODELS, video: true, timeoutMs: 240_000 })
  const segments: Segment[] = []
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*[-–:]?\s*(.+)$/)
    if (m && m[2].trim()) segments.push({ start: toSeconds(m[1]), text: m[2].trim() })
  }
  if (!segments.length) throw new Error('Gemini could not transcribe this video.')
  transcriptCache.set(id, segments)
  return segments
}

async function getSegments(id: string) {
  const captions = await fetchTranscript(id)
  if (captions) return { segments: captions, source: 'captions' as const }
  return { segments: await geminiTranscript(id), source: 'gemini' as const }
}

const SUMMARY_SCHEMA = `{"summary":"string","takeaways":[{"title":"string","body":"string"}],"chapters":[{"time":"MM:SS","title":"string"}]}`

async function summarize(id: string, lang: unknown) {
  const outLang = languageName(lang)
  const rules = `You are summarizing a YouTube video. Use ONLY information actually present in the source. Do not invent facts, names, numbers or claims. Write everything in ${outLang}. Provide a concise summary paragraph, 4 to 6 key takeaways, and 4 to 8 chapters whose "time" values are real timestamps from the source. Return ONLY valid JSON matching: ${SUMMARY_SCHEMA}`
  const meta = await videoMeta(id)
  const titleLine = meta ? `Title: ${meta.title}\n\n` : ''

  const captions = await fetchTranscript(id)
  if (captions) {
    const timed = captions.map((s) => `[${formatTime(s.start)}] ${s.text}`).join('\n')
    return { ...parseJson(await askGemini([{ text: `${rules}\n\n${titleLine}Timestamped transcript:\n${timed}` }], { models: TEXT_MODELS, json: true })), source: 'captions' }
  }

  try {
    const text = await askGemini([videoPart(id), { text: `${rules}\n\n${titleLine}The source is the attached video (watch and listen to all of it).` }], {
      models: VIDEO_MODELS,
      json: true,
      video: true,
      timeoutMs: 200_000,
    })
    return { ...parseJson(text), source: 'video' }
  } catch (e) {
    if (e instanceof FatalGeminiError || !meta) throw e
    const fallback = `${rules}\n\nOnly the video's public metadata is available. Base the summary strictly on it. If there are no timestamps in the description, return an empty chapters array.\n\n${titleLine}Tags: ${meta.tags.join(', ')}\n\nDescription:\n${meta.description}`
    return { ...parseJson(await askGemini([{ text: fallback }], { models: TEXT_MODELS, json: true })), source: 'metadata' }
  }
}

async function handle(body: { url?: unknown; mode?: unknown; lang?: unknown }) {
  const id = typeof body.url === 'string' ? parseVideoId(body.url) : null
  if (!id) return { error: 'Invalid YouTube URL.' }

  if (body.mode === 'full') {
    const { segments, source } = await getSegments(id)
    return { text: segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim(), source }
  }
  if (body.mode === 'script') {
    const { segments, source } = await getSegments(id)
    return { lines: groupLines(segments), source }
  }

  const result = await summarize(id, body.lang)
  return {
    summary: String(result.summary ?? ''),
    takeaways: Array.isArray(result.takeaways) ? result.takeaways : [],
    chapters: Array.isArray(result.chapters) ? result.chapters : [],
    source: result.source,
  }
}

export async function POST(req: Request) {
  let body: { url?: unknown; mode?: unknown; lang?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Stream whitespace while Gemini works so proxies don't drop the idle connection; JSON.parse ignores leading whitespace.
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const keepAlive = setInterval(() => controller.enqueue(encoder.encode(' ')), 5000)
      let payload: object
      try {
        payload = await handle(body)
      } catch (e) {
        payload = { error: e instanceof Error ? e.message : 'Request failed.' }
      }
      clearInterval(keepAlive)
      controller.enqueue(encoder.encode(JSON.stringify(payload)))
      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })
}
