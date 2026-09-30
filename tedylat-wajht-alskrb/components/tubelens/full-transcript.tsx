'use client'

import { useState } from 'react'
import { Check, Copy, LoaderCircle, MessageSquareText } from 'lucide-react'
import type { Dict } from '@/lib/i18n'
import type { VideoInfo } from '@/lib/demo-data'
import { useCopy } from './use-copy'

export function FullTranscript({ t, video }: { t: Dict; video: VideoInfo }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [source, setSource] = useState('')
  const { copied, copy } = useCopy()

  const load = async () => {
    if (!video.id || state === 'loading' || state === 'done') return
    setState('loading')
    setError('')
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url, mode: 'full' }),
      })
      const data = await response.json()
      if (!response.ok || data?.error) throw new Error(data?.error || t.noTranscript)
      setText(typeof data.text === 'string' ? data.text : '')
      setSource(typeof data.source === 'string' ? data.source : '')
      setState('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : t.noTranscript)
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <section className="overflow-hidden rounded-2xl border border-primary/40 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquareText className="size-4 text-primary" aria-hidden="true" />
            {t.fullTextTitle}
          </h2>
          <button
            type="button"
            onClick={() => copy(text)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? t.copied : t.copyText}
          </button>
        </div>
        {source === 'gemini' && (
          <p role="status" className="border-b border-border bg-secondary px-5 py-2 text-xs text-muted-foreground">{t.sourceGemini}</p>
        )}
        <p dir="auto" className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap p-5 leading-loose text-foreground/90">
          {text || t.noTranscript}
        </p>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={load}
        disabled={!video.id || state === 'loading'}
        className="group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 p-5 text-start transition-colors hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          {state === 'loading' ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <MessageSquareText className="size-5" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{t.fullTextTitle}</span>
          <span className="block text-sm text-muted-foreground">
            {state === 'loading' ? t.fullTextLoading : video.id ? t.fullTextHint : t.analyzeFirst}
          </span>
        </span>
      </button>
      {state === 'error' && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
