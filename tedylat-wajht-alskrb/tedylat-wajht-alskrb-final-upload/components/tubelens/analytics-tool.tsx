'use client'

import { useState } from 'react'
import { Calendar, Check, Copy, Eye, Hash, Lightbulb, ListOrdered, LoaderCircle, MessageSquare, Sparkles, ThumbsUp, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { languages, type Dict, type Lang } from '@/lib/i18n'
import type { VideoInfo } from '@/lib/demo-data'
import { useCopy } from './use-copy'
import { RevenueEstimate } from './revenue-estimate'

type Tab = 'overview' | 'tags' | 'summary'
type AIResult = { summary: string; takeaways: { title: string; body: string }[]; chapters: { time: string; title: string }[] }

export function AnalyticsTool({ t, lang, video }: { t: Dict; lang: Lang; video: VideoInfo }) {
  const [tab, setTab] = useState<Tab>('overview')
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t.tabOverview },
    { id: 'tags', label: t.tabTags },
    { id: 'summary', label: t.tabSummary },
  ]

  if (!video.id) return <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">{t.analyzeFirst}</div>

  return (
    <section className="flex flex-col gap-5">
      <div role="tablist" aria-label={t.toolAnalytics} className="flex w-full gap-1 rounded-xl border border-border bg-card p-1 sm:w-fit">
        {tabs.map(({ id, label }) => <button key={id} type="button" role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} onClick={() => setTab(id)} className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-5', tab === id ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>{label}</button>)}
      </div>
      <div role="tabpanel" id={`panel-${tab}`}>
        {tab === 'overview' && <Overview t={t} lang={lang} video={video} />}
        {tab === 'tags' && <Tags t={t} tags={video.tags} />}
        {tab === 'summary' && <Summary t={t} lang={lang} video={video} />}
      </div>
    </section>
  )
}

function Overview({ t, lang, video }: { t: Dict; lang: Lang; video: VideoInfo }) {
  const full = new Intl.NumberFormat('en-US')
  const units = lang === 'ar' ? { m: ' مليون', k: ' ألف' } : { m: 'M', k: 'K' }
  const compact = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}${units.m}` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}${units.k}` : String(n)
  const d = new Date(video.publishedAt)
  const date = lang === 'ar' ? `${d.getUTCDate()} ${['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][d.getUTCMonth()]} ${d.getUTCFullYear()}` : new Intl.DateTimeFormat(languages.find((l) => l.code === lang)?.locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d)
  const views = Math.max(video.views, 1)
  const metrics = [
    { label: t.views, value: compact(video.views), sub: full.format(video.views), icon: Eye },
    { label: t.likes, value: compact(video.likes), sub: full.format(video.likes), icon: ThumbsUp },
    { label: t.comments, value: compact(video.comments), sub: full.format(video.comments), icon: MessageSquare },
    { label: t.published, value: date, sub: null, icon: Calendar },
  ]
  const engagement = ((video.likes + video.comments) / views) * 100
  const ratios = [
    { label: t.engagement, value: `${engagement.toFixed(2)}%`, pct: Math.min(engagement * 10, 100) },
    { label: t.likeRatio, value: ((video.likes / views) * 1000).toFixed(1), pct: Math.min((video.likes / views) * 1000, 100) },
    { label: t.commentRatio, value: ((video.comments / views) * 1000).toFixed(1), pct: Math.min((video.comments / views) * 1000 * 20, 100) },
  ]
  return <div className="flex flex-col gap-5">
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">{metrics.map(({ label, value, sub, icon: Icon }) => <div key={label} className="rounded-2xl border border-border bg-card p-4 md:p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary"><Icon className="size-4" /></span></div><p className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{value}</p>{sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}</div>)}</div>
    <div className="rounded-2xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-semibold"><TrendingUp className="size-4 text-primary" />{t.performance}</h2><ul className="mt-4 flex flex-col gap-4">{ratios.map((r) => <li key={r.label}><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{r.label}</span><span className="font-semibold tabular-nums">{r.value}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${r.pct}%` }} /></div></li>)}</ul></div>
    <RevenueEstimate t={t} views={video.views} />
  </div>
}

function Tags({ t, tags }: { t: Dict; tags: string[] }) {
  const { copied, copy } = useCopy()
  return <div className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-semibold"><Hash className="size-4 text-primary" />{t.tagsTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{t.tagsCount(tags.length)}</p></div><button type="button" onClick={() => copy(tags.join(', '))} disabled={!tags.length} className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3.5 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? t.copied : t.copyAll}</button></div>{tags.length ? <ul className="mt-5 flex flex-wrap gap-2">{tags.map((tag) => <li key={tag}><button type="button" onClick={() => copy(tag)} className="rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-foreground/90 hover:border-primary">#{tag}</button></li>)}</ul> : <p className="mt-5 text-sm text-muted-foreground">{t.noTags}</p>}</div>
}

function Summary({ t, lang, video }: { t: Dict; lang: Lang; video: VideoInfo }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<AIResult | null>(null)
  const [error, setError] = useState('')
  const generate = async () => {
    setState('loading'); setError('')
    try {
      const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: video.url, mode: 'summary', lang }) })
      const data = await res.json(); if (!res.ok || data?.error) throw new Error(data?.error || t.aiError)
      setResult(data); setState('done')
    } catch (e) { setError(e instanceof Error ? e.message : t.aiError); setState('error') }
  }
  return <div className="flex flex-col gap-5"><div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-5 sm:flex-row sm:items-center"><div><h2 className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" />{t.summaryTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{t.summaryIntro}</p></div><button type="button" onClick={generate} disabled={state === 'loading'} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#0F0F0F] shadow disabled:opacity-80">{state === 'loading' ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4 text-primary" />}{state === 'loading' ? t.generating : state === 'done' ? t.regenerate : t.generateSummary}</button></div>
    {state === 'loading' && <div className="grid gap-4 md:grid-cols-2">{[0,1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />)}</div>}
    {state === 'error' && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    {state === 'done' && result && (result as AIResult & { source?: string }).source === 'metadata' && <p role="status" className="rounded-xl border border-border bg-secondary p-3 text-xs text-muted-foreground">{t.sourceMetadata}</p>}
    {state === 'done' && result && <div className="grid gap-5 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-2"><div className="lg:col-span-3"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Lightbulb className="size-4 text-primary" />{t.takeaways}</h3><p className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed">{result.summary}</p><div className="grid gap-3 sm:grid-cols-2">{result.takeaways.map((item, i) => <article key={`${item.title}-${i}`} className="rounded-2xl border border-border bg-card p-4"><span className="text-xs font-bold text-primary">{String(i+1).padStart(2,'0')}</span><h4 className="mt-1 font-semibold">{item.title}</h4><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p></article>)}</div></div><div className="lg:col-span-2"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><ListOrdered className="size-4 text-primary" />{t.chapters}</h3><ol className="rounded-2xl border border-border bg-card p-2">{result.chapters.map(c => <li key={`${c.time}-${c.title}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent"><span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-xs text-primary" dir="ltr">{c.time}</span><span className="text-sm">{c.title}</span></li>)}</ol></div></div>}
  </div>
}
