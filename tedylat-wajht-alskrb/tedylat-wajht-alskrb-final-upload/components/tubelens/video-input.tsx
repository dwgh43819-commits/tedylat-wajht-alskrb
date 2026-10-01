'use client'

import { useState, type FormEvent } from 'react'
import { Link, LoaderCircle, Search } from 'lucide-react'
import type { Dict } from '@/lib/i18n'
import { parseVideoId, type VideoInfo } from '@/lib/demo-data'

type VideoInputProps = {
  t: Dict
  video: VideoInfo
  onAnalyzed: (video: VideoInfo) => void
}

export function VideoInput({ t, video, onAnalyzed }: VideoInputProps) {
  const [url, setUrl] = useState(video.url)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const id = parseVideoId(url)
    if (!id) {
      setError(t.invalidUrl)
      return
    }
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || t.analyzeError)
      onAnalyzed(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.analyzeError)
    } finally {
      setLoading(false)
    }
  }

  const thumbnail = video.thumbnailUrl || (video.id ? `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg` : '')

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center md:p-5">
        <label htmlFor="video-url" className="sr-only">{t.urlLabel}</label>
        <div className="relative flex-1">
          <Link className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="video-url"
            dir="ltr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t.urlPlaceholder}
            aria-invalid={!!error}
            aria-describedby={error ? 'video-url-error' : undefined}
            className="h-12 w-full rounded-xl border border-input bg-background ps-10 pe-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 rtl:text-right"
          />
        </div>
        <button type="submit" disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-[#b30000] disabled:opacity-70">
          {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
          {loading ? t.analyzing : t.analyze}
        </button>
      </form>
      {error && <p id="video-url-error" role="alert" className="px-5 pb-3 text-sm text-destructive">{error}</p>}

      {video.id ? (
        <div className="flex items-center gap-4 border-t border-border bg-surface p-4 md:p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnail} alt="" width={160} height={90} className="aspect-video w-28 shrink-0 rounded-lg bg-secondary object-cover sm:w-40" />
          <div className="min-w-0">
            <p className="line-clamp-2 font-medium leading-snug" dir="auto">{video.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.channel}: <span className="text-foreground/90">{video.channel}</span></p>
            <p className="mt-1 text-xs text-muted-foreground">{t.liveDataNote}</p>
          </div>
        </div>
      ) : (
        <div className="border-t border-border bg-surface px-5 py-4 text-sm text-muted-foreground">{t.readyToAnalyze}</div>
      )}
    </section>
  )
}
