'use client'

import { AudioLines, ChartColumn, Download, FileText, LogIn, Mail, Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Dict, Lang, ToolId } from '@/lib/i18n'
import { LanguageMenu } from './language-menu'

type SidebarProps = {
  t: Dict
  lang: Lang
  active: ToolId
  onSelect: (id: ToolId) => void
  onLangChange: (lang: Lang) => void
  open: boolean
  onClose: () => void
}

export function Sidebar({ t, lang, active, onSelect, onLangChange, open, onClose }: SidebarProps) {
  const items: { id: ToolId | 'download'; label: string; desc: string; icon: typeof ChartColumn; soon?: boolean }[] = [
    { id: 'analytics', label: t.toolAnalytics, desc: t.toolAnalyticsDesc, icon: ChartColumn },
    { id: 'script', label: t.toolScript, desc: t.toolScriptDesc, icon: FileText },
    { id: 'audio', label: t.toolAudio, desc: t.toolAudioDesc, icon: AudioLines, soon: true },
    { id: 'download', label: t.toolDownload, desc: t.toolDownloadDesc, icon: Download, soon: true },
  ]

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-black/70 transition-opacity md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-40 flex w-72 flex-col border-e border-border bg-surface transition-transform duration-300 md:sticky md:top-0 md:h-dvh md:translate-x-0!',
          open ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
              <Play className="size-5 fill-white text-white" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight tracking-tight" dir="ltr">
                Tube<span className="text-primary">Lens</span>
              </p>
              <p className="text-xs text-muted-foreground">{t.brandTagline}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            aria-label={t.closeMenu}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 px-3" aria-label={t.tools}>
          <p className="px-3 pb-2 pt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.tools}</p>
          <ul className="flex flex-col gap-1">
            {items.map(({ id, label, desc, icon: Icon, soon }) => {
              const isActive = active === id
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => !soon && id !== 'download' && onSelect(id)}
                    disabled={soon}
                    aria-disabled={soon || undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-start transition-colors',
                      soon
                        ? 'cursor-not-allowed text-muted-foreground opacity-60'
                        : isActive
                          ? 'bg-primary/12 text-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    {soon && (
                      <span className="absolute end-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                        {t.comingSoon}
                      </span>
                    )}
                    {isActive && <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-primary" aria-hidden="true" />}
                    <span
                      className={cn(
                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                        isActive ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-muted-foreground">{desc}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex flex-col gap-3 border-t border-border p-4">
          <section aria-labelledby="signin-title" className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="signin-title" className="flex items-center gap-2 text-sm font-semibold">
                <LogIn className="size-4 text-primary" aria-hidden="true" />
                {t.signInTitle}
              </h2>
              <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">{t.comingSoon}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t.signInDesc}</p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                disabled
                className="inline-flex h-9 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-[#0F0F0F] opacity-70"
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
                </svg>
                {t.signInGoogle}
              </button>
              <button
                type="button"
                disabled
                className="inline-flex h-9 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border bg-secondary text-xs font-semibold opacity-70"
              >
                <Mail className="size-4" aria-hidden="true" />
                {t.signInEmail}
              </button>
            </div>
          </section>
          <LanguageMenu t={t} lang={lang} onChange={onLangChange} />
          <p className="px-1 text-xs text-muted-foreground">{t.freeForever}</p>
        </div>
      </aside>
    </>
  )
}
