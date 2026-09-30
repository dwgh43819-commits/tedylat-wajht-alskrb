```tsx
'use client'

import { useState } from 'react'
import { Menu, Sparkles } from 'lucide-react'
import { dictionaries, isRtl, type Lang, type ToolId } from '@/lib/i18n'
import { emptyVideo, type VideoInfo } from '@/lib/demo-data'
import { Sidebar } from './sidebar'
import { VideoInput } from './video-input'
import { AnalyticsTool } from './analytics-tool'
import { ScriptExtractor } from './script-extractor'
import { AudioIsolator } from './audio-isolator'
import { FullTranscript } from './full-transcript'

export function TubeLensApp() {
  const [lang, setLang] = useState<Lang>('ar')
  const [tool, setTool] = useState<ToolId>('analytics')
  const [video, setVideo] = useState<VideoInfo>(emptyVideo())
  const [menuOpen, setMenuOpen] = useState(false)
  const t = dictionaries[lang]
  const dir = isRtl(lang) ? 'rtl' : 'ltr'

  const changeLang = (next: Lang) => {
    setLang(next)
    document.documentElement.lang = next
    document.documentElement.dir = isRtl(next) ? 'rtl' : 'ltr'
  }

  const selectTool = (id: ToolId) => {
    setTool(id)
    setMenuOpen(false)
  }

  const hero: Record<ToolId, { title: string; desc: string }> = {
    analytics: { title: t.heroAnalytics, desc: t.heroAnalyticsDesc },
    script: { title: t.heroScript, desc: t.heroScriptDesc },
    audio: { title: t.heroAudio, desc: t.heroAudioDesc },
  }

  return (
    <div
      dir={dir}
      lang={lang}
      className="flex min-h-dvh bg-background text-foreground"
      aria-label="TubeLens"
    >
      <Sidebar
        t={t}
        lang={lang}
        active={tool}
        onSelect={selectTool}
        onLangChange={changeLang}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 flex items-center border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label={t.openMenu}
            aria-expanded={menuOpen}
            aria-controls="tubelens-sidebar"
          >
            <Menu className="size-5" />
          </button>
        </div>

        <main
          className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 md:px-8 md:py-14"
          aria-labelledby="tubelens-page-title"
        >
          <header className="flex flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {t.heroBadge}
            </span>

            <h1
              id="tubelens-page-title"
              className="text-balance text-4xl font-bold tracking-tight md:text-6xl"
            >
              {hero[tool].title}
            </h1>

            <p
              id="tubelens-page-description"
              className="max-w-xl text-pretty text-base leading-relaxed text
```
