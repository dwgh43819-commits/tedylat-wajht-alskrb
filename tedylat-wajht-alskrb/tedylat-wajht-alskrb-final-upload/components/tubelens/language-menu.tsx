'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { languages, type Dict, type Lang } from '@/lib/i18n'

type LanguageMenuProps = {
  t: Dict
  lang: Lang
  onChange: (lang: Lang) => void
}

export function LanguageMenu({ t, lang, onChange }: LanguageMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = languages.find((l) => l.code === lang) ?? languages[0]

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <ul
          id="language-listbox"
          role="listbox"
          aria-label={t.chooseLanguage}
          className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          {languages.map((l) => {
            const selected = l.code === lang
            return (
              <li key={l.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(l.code)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors',
                    selected ? 'bg-primary/12 text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-8 items-center justify-center rounded-md text-[10px] font-semibold',
                      selected ? 'bg-primary text-white' : 'bg-secondary',
                    )}
                  >
                    {l.short}
                  </span>
                  <span className="flex-1 font-medium" lang={l.code}>
                    {l.name}
                  </span>
                  {selected && <Check className="size-4 text-primary" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="language-listbox"
        aria-label={`${t.chooseLanguage}: ${current.name}`}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border bg-secondary px-3 py-2.5 text-sm transition-colors hover:bg-accent',
          open ? 'border-primary/60' : 'border-border',
        )}
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Globe className="size-4" aria-hidden="true" />
        </span>
        <span className="flex-1 text-start">
          <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">{t.language}</span>
          <span className="block font-medium">{current.name}</span>
        </span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
    </div>
  )
}
