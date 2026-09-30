'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import {
  AudioLines,
  Check,
  CircleAlert,
  Download,
  FileAudio,
  Film,
  Link2,
  LoaderCircle,
  Mic,
  Music,
  Pause,
  Play,
  Upload,
  VideoOff,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Dict } from '@/lib/i18n'
import { MAX_BYTES, SeparationError, separateAudio, type SeparationMode, type SeparationResult, type Stage } from '@/lib/audio-separation'
import { LinkError, fetchMediaFromUrl, type LinkErrorCode } from '@/lib/media-url'

type Source = 'upload' | 'link'

type Status = 'idle' | 'processing' | 'done' | 'error'
type Outputs = { audioUrl: string | null; videoUrl: string | null; result: SeparationResult; baseName: string }

const formatLimit = (bytes: number) => `${bytes / 1024 / 1024 / 1024} GB`

const formatSize = (bytes: number) =>
  bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(2)} GB`
    : bytes >= 1024 ** 2
      ? `${(bytes / 1024 ** 2).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`

export function AudioIsolator({ t }: { t: Dict }) {
  const [mode, setMode] = useState<SeparationMode>('vocals')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [stage, setStage] = useState<Stage>('loading')
  const [ratio, setRatio] = useState(0)
  const [error, setError] = useState('')
  const [outputs, setOutputs] = useState<Outputs | null>(null)
  const [dragging, setDragging] = useState(false)
  const [source, setSource] = useState<Source>('upload')
  const [link, setLink] = useState('')
  const [linkProgress, setLinkProgress] = useState<{ received: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const linkAbortRef = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      if (outputs?.audioUrl) URL.revokeObjectURL(outputs.audioUrl)
      if (outputs?.videoUrl) URL.revokeObjectURL(outputs.videoUrl)
    },
    [outputs],
  )

  useEffect(() => () => linkAbortRef.current?.abort(), [])

  const fetchLink = async (e: FormEvent) => {
    e.preventDefault()
    if (!link.trim() || linkProgress) return
    const controller = new AbortController()
    linkAbortRef.current = controller
    setOutputs(null)
    setError('')
    setStatus('idle')
    setLinkProgress({ received: 0, total: 0 })
    try {
      const fetched = await fetchMediaFromUrl(link, MAX_BYTES[mode], (received, total) => setLinkProgress({ received, total }), controller.signal)
      setFile(fetched)
      setLink('')
    } catch (err) {
      if (controller.signal.aborted) return
      const code: LinkErrorCode = err instanceof LinkError ? err.code : 'failed'
      const messages: Record<LinkErrorCode, string> = {
        invalid: t.linkInvalid,
        platform: t.linkPlatform,
        notMedia: t.linkNotMedia,
        tooLarge: t.fileTooLarge(formatLimit(MAX_BYTES[mode])),
        failed: t.linkFailed,
      }
      setError(messages[code])
      setStatus('error')
    } finally {
      if (linkAbortRef.current === controller) linkAbortRef.current = null
      setLinkProgress(null)
    }
  }

  const cancelLink = () => {
    linkAbortRef.current?.abort()
    setLinkProgress(null)
  }

  const changeSource = (s: Source) => {
    if (linkProgress || status === 'processing') return
    setSource(s)
    setError('')
    if (status === 'error') setStatus('idle')
  }

  const modes: { id: SeparationMode; title: string; desc: string; icon: LucideIcon }[] = [
    { id: 'vocals', title: t.modeVocals, desc: t.modeVocalsDesc, icon: Mic },
    { id: 'music', title: t.modeMusic, desc: t.modeMusicDesc, icon: Music },
    { id: 'video', title: t.modeVideo, desc: t.modeVideoDesc, icon: Film },
  ]

  const validate = (f: File, m: SeparationMode) => {
    if (f.size > MAX_BYTES[m]) {
      setError(t.fileTooLarge(formatLimit(MAX_BYTES[m])))
      setStatus('error')
      return false
    }
    return true
  }

  const pickFile = (f: File | undefined) => {
    if (!f) return
    setOutputs(null)
    setError('')
    setStatus('idle')
    if (!validate(f, mode)) return
    setFile(f)
  }

  const changeMode = (m: SeparationMode) => {
    if (status === 'processing') return
    setMode(m)
    setOutputs(null)
    setError('')
    setStatus('idle')
    if (file) validate(file, m)
  }

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0])
    e.target.value = ''
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    pickFile(e.dataTransfer.files?.[0])
  }

  const process = async () => {
    if (!file || !validate(file, mode)) return
    setStatus('processing')
    setOutputs(null)
    setError('')
    setRatio(0)
    try {
      const result = await separateAudio(file, mode, (s, r) => {
        setStage(s)
        setRatio(r)
      })
      setOutputs({
        result,
        audioUrl: result.audio ? URL.createObjectURL(result.audio.blob) : null,
        videoUrl: result.video ? URL.createObjectURL(result.video) : null,
        baseName: file.name.replace(/\.[^.]+$/, ''),
      })
      setStatus('done')
    } catch (err) {
      const code = err instanceof SeparationError ? err.code : 'decode'
      const messages: Record<SeparationError['code'], string> = {
        engine: t.engineError,
        memory: t.memoryError,
        noAudio: t.noAudioError,
        noVideo: t.noVideoError,
        decode: t.audioError,
      }
      setError(messages[code])
      setStatus('error')
    }
  }

  const stageLabel = { loading: t.stepLoading, processing: t.stepProcessing, finishing: t.stepFinishing }[stage]
  const busy = status === 'processing'

  return (
    <section className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-muted-foreground">{t.chooseMode}</legend>
        <div className="grid gap-3 md:grid-cols-3" role="radiogroup">
          {modes.map(({ id, title, desc, icon: Icon }) => {
            const active = mode === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={busy}
                onClick={() => changeMode(id)}
                className={cn(
                  'relative flex items-start gap-3 rounded-2xl border p-4 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  active ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50',
                )}
              >
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl',
                    active ? 'bg-primary text-white' : 'bg-secondary text-primary',
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-semibold leading-snug">{title}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{desc}</span>
                </span>
                {active && (
                  <span className="absolute end-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'rounded-2xl border bg-card p-5 transition-colors md:p-6',
          dragging ? 'border-primary bg-primary/5' : 'border-border',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={mode === 'video' ? 'video/*' : 'audio/*,video/*'}
          onChange={onInput}
          className="sr-only"
          id="audio-file"
        />

        {!file && (
          <div role="tablist" aria-label={`${t.sourceUpload} / ${t.sourceLink}`} className="mb-4 inline-flex rounded-xl bg-secondary p-1">
            {([
              { id: 'upload', label: t.sourceUpload, icon: Upload },
              { id: 'link', label: t.sourceLink, icon: Link2 },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={source === id}
                disabled={!!linkProgress}
                onClick={() => changeSource(id)}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-60',
                  source === id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        )}

        {!file && source === 'link' ? (
          <form onSubmit={fetchLink} className="flex flex-col gap-3 rounded-xl border border-dashed border-border px-4 py-8 sm:px-6">
            <label htmlFor="media-link" className="flex items-center gap-2 font-medium">
              <Link2 className="size-4 text-primary" aria-hidden="true" />
              {t.linkLabel}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="media-link"
                type="url"
                inputMode="url"
                dir="ltr"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={!!linkProgress}
                placeholder={t.linkPlaceholder}
                className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
              {linkProgress ? (
                <button
                  type="button"
                  onClick={cancelLink}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-accent"
                >
                  {t.cancel}
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-[#b30000]"
                >
                  <Download className="size-4" aria-hidden="true" />
                  {t.fetchLink}
                </button>
              )}
            </div>
            {linkProgress ? (
              <div role="status" aria-live="polite" className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium">
                    <LoaderCircle className="size-3.5 animate-spin text-primary" aria-hidden="true" />
                    {t.fetchingLink}
                  </span>
                  <span className="tabular-nums text-muted-foreground" dir="ltr">
                    {formatSize(linkProgress.received)}
                    {linkProgress.total ? ` / ${formatSize(linkProgress.total)}` : ''}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full rounded-full bg-primary transition-all duration-300', !linkProgress.total && 'animate-pulse')}
                    style={{ width: linkProgress.total ? `${Math.max((linkProgress.received / linkProgress.total) * 100, 2)}%` : '35%' }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">{t.linkHint}</p>
            )}
            <p className="text-xs text-muted-foreground">{t.fileLimit(formatLimit(MAX_BYTES[mode]))}</p>
          </form>
        ) : !file ? (
          <label
            htmlFor="audio-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center transition-colors hover:border-primary/60"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Upload className="size-6" aria-hidden="true" />
            </span>
            <span className="font-medium">{t.dropFile}</span>
            <span className="max-w-md text-sm text-muted-foreground">{t.audioIntro}</span>
            <span className="text-xs text-muted-foreground">{t.fileLimit(formatLimit(MAX_BYTES[mode]))}</span>
          </label>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <FileAudio className="size-5 text-primary" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium" dir="auto">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {formatSize(file.size)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                {t.changeFile}
              </button>
              <button
                type="button"
                onClick={process}
                disabled={busy}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-[#b30000] disabled:opacity-70"
              >
                {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <WandSparkles className="size-4" aria-hidden="true" />}
                {busy ? t.processing : status === 'done' ? t.reprocess : t.processAudio}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {busy && (
        <div className="rounded-2xl border border-primary/40 bg-card p-6" role="status" aria-live="polite">
          <div className="flex h-16 items-center justify-center gap-1" aria-hidden="true">
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className="animate-wave h-full w-1.5 rounded-full bg-primary"
                style={{ animationDelay: `${(i % 10) * 90}ms`, opacity: 0.4 + ((i * 7) % 10) / 16 }}
              />
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="font-medium">{stageLabel}</span>
            <span className="tabular-nums text-muted-foreground" dir="ltr">
              {Math.round(ratio * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${Math.max(ratio * 100, 2)}%` }} />
          </div>
        </div>
      )}

      {status === 'done' && outputs && <Results t={t} outputs={outputs} />}

      {status === 'idle' && !file && (
        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <AudioLines className="size-3.5" aria-hidden="true" />
          {t.audioTitle}
        </p>
      )}
    </section>
  )
}

function Results({ t, outputs }: { t: Dict; outputs: Outputs }) {
  const { result, audioUrl, videoUrl, baseName } = outputs
  const audioMeta = {
    vocals: { title: t.vocals, desc: t.vocalsDesc, icon: Mic, suffix: 'voice' },
    music: { title: t.music, desc: t.musicDesc, icon: Music, suffix: 'music' },
    video: { title: t.extractedAudio, desc: t.extractedAudioDesc, icon: AudioLines, suffix: 'audio' },
  }[result.mode]

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {result.mono && (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          <CircleAlert className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {t.monoWarning}
        </p>
      )}

      <div className={cn('grid gap-4', videoUrl && audioUrl && 'lg:grid-cols-2')}>
        {videoUrl && (
          <article className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-white text-[#0F0F0F]">
                  <VideoOff className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold">{t.silentVideo}</h3>
                  <p className="text-xs text-muted-foreground">{t.silentVideoDesc}</p>
                </div>
              </div>
              <DownloadLink t={t} href={videoUrl} fileName={`${baseName}-no-audio.${result.videoExt}`} />
            </div>
            <video src={videoUrl} controls muted playsInline className="mt-4 aspect-video w-full rounded-xl bg-black" />
          </article>
        )}

        {audioUrl && result.audio && (
          <TrackCard
            t={t}
            title={audioMeta.title}
            desc={audioMeta.desc}
            icon={audioMeta.icon}
            url={audioUrl}
            peaks={result.audio.peaks}
            fileName={`${baseName}-${audioMeta.suffix}.mp3`}
          />
        )}
      </div>

      {result.mode === 'video' && !audioUrl && (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          <CircleAlert className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {t.noAudioError}
        </p>
      )}
    </div>
  )
}

function DownloadLink({ t, href, fileName }: { t: Dict; href: string; fileName: string }) {
  return (
    <a
      href={href}
      download={fileName}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <Download className="size-4" aria-hidden="true" />
      {t.download}
    </a>
  )
}

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(Math.floor(s % 60)).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

function TrackCard({
  t,
  title,
  desc,
  icon: Icon,
  url,
  peaks,
  fileName,
}: {
  t: Dict
  title: string
  desc: string
  icon: LucideIcon
  url: string
  peaks: number[]
  fileName: string
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const pct = duration ? (elapsed / duration) * 100 : 0
  const bars = useMemo(() => (peaks.length ? peaks : new Array(64).fill(0.3)), [peaks])

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      document.querySelectorAll('audio, video').forEach((a) => a !== el && (a as HTMLMediaElement).pause())
      void el.play()
    } else el.pause()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    el.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  return (
    <article className={cn('rounded-2xl border bg-card p-5 transition-colors', playing ? 'border-primary/60' : 'border-border')}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <DownloadLink t={t} href={url} fileName={fileName} />
      </div>

      <div className="mt-5 flex h-14 cursor-pointer items-center gap-[3px]" dir="ltr" onClick={seek} aria-hidden="true">
        {bars.map((p, i) => {
          const reached = (i / bars.length) * 100 <= pct
          return (
            <span
              key={i}
              className={cn('flex-1 rounded-full transition-colors', reached ? 'bg-primary' : 'bg-secondary')}
              style={{ height: `${Math.max(8, p * 100)}%` }}
            />
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-3" dir="ltr">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={`${playing ? t.pause : t.play} — ${title}`}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105"
        >
          {playing ? <Pause className="size-5 fill-current" aria-hidden="true" /> : <Play className="size-5 translate-x-px fill-current" aria-hidden="true" />}
        </button>
        <div className="h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-secondary" onClick={seek}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {fmt(elapsed)} / {fmt(duration)}
        </span>
      </div>
    </article>
  )
}
