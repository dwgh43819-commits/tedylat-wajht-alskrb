'use client'

import { useState } from 'react'
import { Check, Copy, Download, FileText, LoaderCircle } from 'lucide-react'
import type { Dict } from '@/lib/i18n'
import type { VideoInfo } from '@/lib/demo-data'
import { useCopy } from './use-copy'

type Line = { time: string; text: string }

export function ScriptExtractor({ t, video }: { t: Dict; video: VideoInfo }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [lines, setLines] = useState<Line[]>([])
  const [error, setError] = useState('')
  const [source, setSource] = useState('')
  const { copied, copy } = useCopy()
  const plain = lines.map((l) => `[${l.time}] ${l.text}`).join('\n')

  const extract = async () => {
    if (!video.id) return
    setState('loading'); setError('')
    try {
      const response = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: video.url, mode: 'script' }) })
      const data = await response.json()
      if (!response.ok || data?.error) throw new Error(data?.error || t.aiError)
      setLines(Array.isArray(data.lines) ? data.lines : [])
      setSource(typeof data.source === 'string' ? data.source : '')
      setState('done')
    } catch (e) { setError(e instanceof Error ? e.message : t.aiError); setState('error') }
  }

  const download = () => {
    const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'tubelens-script.txt'; a.click(); URL.revokeObjectURL(url)
  }

  return <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="h-1.5 bg-primary" /><div className="flex flex-col items-start justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center"><div><h2 className="flex items-center gap-2 font-semibold"><FileText className="size-4 text-primary" />{t.scriptTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{t.scriptIntro}</p></div><button type="button" onClick={extract} disabled={!video.id || state === 'loading'} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-70">{state === 'loading' ? <LoaderCircle className="size-4 animate-spin" /> : <FileText className="size-4" />}{state === 'loading' ? t.extracting : t.extractScript}</button></div>
    {!video.id && <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-sm text-muted-foreground">{t.analyzeFirst}</div>}
    {state === 'idle' && video.id && <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-secondary"><FileText className="size-6 text-muted-foreground" /></span><p className="max-w-sm text-sm text-muted-foreground">{t.scriptIntro}</p></div>}
    {state === 'loading' && <ul className="flex flex-col gap-3 p-5">{[80,65,90,55,75].map((w,i)=><li key={i} className="flex items-center gap-3"><span className="h-6 w-14 animate-pulse rounded-md bg-secondary" /><span className="h-4 animate-pulse rounded bg-secondary" style={{width:`${w}%`}} /></li>)}</ul>}
    {state === 'error' && <p role="alert" className="m-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    {state === 'done' && (lines.length ? <><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-5 py-3"><span className="text-xs text-muted-foreground">{t.lines(lines.length)}</span><div className="flex gap-2"><button type="button" onClick={()=>copy(plain)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium">{copied?<Check className="size-3.5"/>:<Copy className="size-3.5"/>}{copied?t.copied:t.copyScript}</button><button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium"><Download className="size-3.5"/>{t.downloadTxt}</button></div></div>{source === 'gemini' && <p role="status" className="border-b border-border bg-secondary px-5 py-2 text-xs text-muted-foreground">{t.sourceGemini}</p>}<ol dir="auto" className="relative max-h-[28rem] overflow-y-auto p-5">{lines.map((line,i)=><li key={`${line.time}-${i}`} className="group relative flex gap-4 pb-5 last:pb-0"><span className="relative flex flex-col items-center"><span className="rounded-md bg-primary/15 px-2 py-1 font-mono text-xs font-semibold text-primary" dir="ltr">[{line.time}]</span>{i<lines.length-1&&<span className="mt-2 w-px flex-1 bg-border"/>}</span><p className="pt-0.5 leading-relaxed text-foreground/90">{line.text}</p></li>)}</ol></> : <p className="p-6 text-center text-sm text-muted-foreground">{t.noTranscript}</p>)}
  </section>
}
