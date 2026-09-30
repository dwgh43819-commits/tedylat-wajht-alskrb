import type { FFmpeg } from '@ffmpeg/ffmpeg'

export type SeparationMode = 'vocals' | 'music' | 'video'

export type Stage = 'loading' | 'processing' | 'finishing'

export type AudioOutput = { blob: Blob; peaks: number[] }

export type SeparationResult = {
  mode: SeparationMode
  audio: AudioOutput | null
  video: Blob | null
  videoExt: string
  mono: boolean
}

const GB = 1024 * 1024 * 1024

export const MAX_BYTES: Record<SeparationMode, number> = {
  vocals: 256 * 1024 * 1024,
  music: 256 * 1024 * 1024,
  video: 512 * 1024 * 1024,
}

export class SeparationError extends Error {
  constructor(public code: 'engine' | 'noAudio' | 'noVideo' | 'memory' | 'decode') {
    super(code)
  }
}

const CORE_BASE = '/ffmpeg'
const WASM_SIZE = 32_232_419
const MOUNT = '/input'
const VIDEO_EXTS = ['mp4', 'mov', 'm4v', 'mkv', 'webm', 'avi']

let enginePromise: Promise<FFmpeg> | null = null

async function fetchWithProgress(url: string, onProgress: (ratio: number) => void) {
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error('download failed')
  const total = Number(res.headers.get('content-length')) || WASM_SIZE
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.byteLength
    onProgress(Math.min(received / total, 0.99))
  }
  return URL.createObjectURL(new Blob(chunks as BlobPart[], { type: 'application/wasm' }))
}

function getEngine(onLoadProgress: (ratio: number) => void) {
  if (!enginePromise) {
    enginePromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const ffmpeg = new FFmpeg()
      const base = new URL(CORE_BASE, window.location.origin).href
      const wasmURL = await fetchWithProgress(`${base}/ffmpeg-core.wasm`, onLoadProgress)
      await ffmpeg.load({
        classWorkerURL: `${base}/worker.js`,
        coreURL: `${base}/ffmpeg-core.js`,
        wasmURL,
      })
      return ffmpeg
    })().catch((err) => {
      enginePromise = null
      throw err
    })
  }
  return enginePromise
}

function toPeaks(raw: Uint8Array, bins = 64) {
  const samples = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4))
  if (!samples.length) return { peaks: new Array(bins).fill(0), mean: 0 }
  const size = Math.max(1, Math.floor(samples.length / bins))
  const out: number[] = []
  let total = 0
  for (let b = 0; b < bins; b++) {
    let sum = 0
    let count = 0
    for (let i = b * size; i < Math.min((b + 1) * size, samples.length); i++) {
      sum += samples[i]
      count++
    }
    out.push(count ? sum / count : 0)
  }
  for (let i = 0; i < samples.length; i++) total += samples[i]
  const max = Math.max(...out)
  return { peaks: out.map((v) => (max ? v / max : 0)), mean: total / samples.length }
}

const envelope = 'aeval=exprs=abs(val(0)),aresample=200'
const mp3 = ['-c:a', 'libmp3lame', '-b:a', '192k']

function vocalsGraph() {
  return [
    '[0:a:0]aformat=channel_layouts=stereo,pan=mono|c0=0.5*c0+0.5*c1,',
    'highpass=f=120,highpass=f=120,lowpass=f=8000,afftdn=nf=-25,',
    'dynaudnorm=f=250:g=15,asplit=2[out][e];',
    `[e]${envelope}[pk]`,
  ].join('')
}

function musicGraph() {
  return [
    '[0:a:0]aformat=channel_layouts=stereo,asplit=2[x][y];',
    '[x]pan=stereo|c0=0.5*c0-0.5*c1|c1=0.5*c1-0.5*c0,asplit=2[side][se];',
    '[y]pan=stereo|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1,lowpass=f=160,lowpass=f=160[bass];',
    '[side][bass]amix=inputs=2:normalize=0,dynaudnorm=f=250:g=15,asplit=2[out][e];',
    `[e]pan=mono|c0=0.5*c0+0.5*c1,${envelope}[pk];`,
    `[se]pan=mono|c0=c0,${envelope}[sd]`,
  ].join('')
}

function extractGraph() {
  return `[0:a:0]asplit=2[a][e];[e]pan=mono|c0=c0,${envelope}[pk]`
}

async function safeRead(ffmpeg: FFmpeg, path: string) {
  try {
    return (await ffmpeg.readFile(path)) as Uint8Array
  } catch {
    return null
  }
}

async function cleanup(ffmpeg: FFmpeg, paths: string[]) {
  await Promise.all(paths.map((p) => ffmpeg.deleteFile(p).catch(() => undefined)))
  await ffmpeg.unmount(MOUNT).catch(() => undefined)
  await ffmpeg.deleteDir(MOUNT).catch(() => undefined)
}

export async function separateAudio(
  file: File,
  mode: SeparationMode,
  onProgress: (stage: Stage, ratio: number) => void,
): Promise<SeparationResult> {
  onProgress('loading', 0)
  let ffmpeg: FFmpeg
  try {
    ffmpeg = await getEngine((r) => onProgress('loading', r))
  } catch {
    throw new SeparationError('engine')
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase()
  const videoExt = VIDEO_EXTS.includes(ext) ? ext : 'mkv'
  const input = `${MOUNT}/${file.name}`
  const outputs = ['out.mp3', 'peaks.raw', 'side.raw', `video.${videoExt}`]

  let weight = { start: 0, span: 1 }
  const onFfmpegProgress = ({ progress }: { progress: number }) => {
    if (Number.isFinite(progress)) onProgress('processing', weight.start + Math.min(Math.max(progress, 0), 1) * weight.span)
  }
  let lastLog = ''
  const onLog = ({ message }: { message: string }) => {
    lastLog = message
  }

  await cleanup(ffmpeg, outputs)
  await ffmpeg.createDir(MOUNT).catch(() => undefined)
  await ffmpeg.mount('WORKERFS' as never, { files: [file] }, MOUNT)
  ffmpeg.on('progress', onFfmpegProgress)
  ffmpeg.on('log', onLog)

  const fail = (code: SeparationError['code']) => {
    if (/memory|OOM|Cannot enlarge/i.test(lastLog)) return new SeparationError('memory')
    return new SeparationError(code)
  }

  try {
    onProgress('processing', 0)
    let video: Blob | null = null

    if (mode === 'video') {
      weight = { start: 0, span: 0.25 }
      const code = await ffmpeg.exec(['-hide_banner', '-i', input, '-map', '0:v:0', '-c', 'copy', '-an', `video.${videoExt}`])
      const data = code === 0 ? await safeRead(ffmpeg, `video.${videoExt}`) : null
      if (!data) throw fail('noVideo')
      video = new Blob([data], { type: videoExt === 'webm' ? 'video/webm' : 'video/mp4' })
      await ffmpeg.deleteFile(`video.${videoExt}`).catch(() => undefined)
      weight = { start: 0.25, span: 0.75 }
    }

    const graph = mode === 'vocals' ? vocalsGraph() : mode === 'music' ? musicGraph() : extractGraph()
    const audioOut = mode === 'video' ? '[a]' : '[out]'
    const args = ['-hide_banner', '-i', input, '-filter_complex', graph, '-map', audioOut, ...mp3, 'out.mp3']
    args.push('-map', '[pk]', '-f', 'f32le', 'peaks.raw')
    if (mode === 'music') args.push('-map', '[sd]', '-f', 'f32le', 'side.raw')

    const code = await ffmpeg.exec(args)
    const audioData = code === 0 ? await safeRead(ffmpeg, 'out.mp3') : null

    if (!audioData) {
      if (mode === 'video' && video) {
        onProgress('finishing', 1)
        return { mode, audio: null, video, videoExt, mono: false }
      }
      throw fail(/does not contain|matches no streams|Stream specifier/i.test(lastLog) ? 'noAudio' : 'decode')
    }

    onProgress('finishing', 1)
    const peaksRaw = await safeRead(ffmpeg, 'peaks.raw')
    const { peaks } = peaksRaw ? toPeaks(peaksRaw) : { peaks: [] }
    let mono = false
    if (mode === 'music') {
      const sideRaw = await safeRead(ffmpeg, 'side.raw')
      mono = sideRaw ? toPeaks(sideRaw).mean < 0.002 : false
    }

    return {
      mode,
      audio: { blob: new Blob([audioData], { type: 'audio/mpeg' }), peaks },
      video,
      videoExt,
      mono,
    }
  } finally {
    ffmpeg.off('progress', onFfmpegProgress)
    ffmpeg.off('log', onLog)
    await cleanup(ffmpeg, outputs)
  }
}
