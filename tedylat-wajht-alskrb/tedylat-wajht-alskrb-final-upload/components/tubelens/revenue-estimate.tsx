'use client'

import { useState } from 'react'
import { CircleDollarSign, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Dict } from '@/lib/i18n'

type Niche = keyof Dict['niches']
type Region = keyof Dict['regions']

const NICHE_RPM: Record<Niche, [number, number]> = {
  general: [1, 3],
  entertainment: [0.5, 2.5],
  gaming: [1, 3.5],
  education: [3, 8],
  tech: [4, 10],
  finance: [8, 20],
}

const REGION_FACTOR: Record<Region, number> = {
  global: 1,
  us: 2.2,
  gulf: 1.1,
  egypt: 0.35,
}

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n)

export function RevenueEstimate({ t, views }: { t: Dict; views: number }) {
  const [niche, setNiche] = useState<Niche>('general')
  const [region, setRegion] = useState<Region>('global')

  const [baseLow, baseHigh] = NICHE_RPM[niche]
  const factor = REGION_FACTOR[region]
  const rpmLow = baseLow * factor
  const rpmHigh = baseHigh * factor
  const low = (views / 1000) * rpmLow
  const high = (views / 1000) * rpmHigh

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-semibold">
            <CircleDollarSign className="size-4 text-primary" aria-hidden="true" />
            {t.revenueTitle}
          </h2>
          <p className="text-sm text-muted-foreground">{t.revenueIntro}</p>
        </div>

        <div className="rounded-xl border border-border bg-background/60 px-5 py-4 lg:min-w-64">
          <p className="text-xs text-muted-foreground">{t.estimatedEarnings}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums" dir="ltr">
            {usd(low)} – {usd(high)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.rpm}: <span dir="ltr" className="font-medium text-foreground">{`${usd(rpmLow)} – ${usd(rpmHigh)}`}</span> {t.perThousand}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <OptionGroup label={t.niche} options={t.niches} value={niche} onChange={setNiche} />
        <OptionGroup label={t.region} options={t.regions} value={region} onChange={setRegion} />
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {t.revenueNote}
      </p>
    </div>
  )
}

function OptionGroup<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Record<K, string>
  value: K
  onChange: (v: K) => void
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(options) as K[]).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            onClick={() => onChange(key)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              value === key ? 'border-primary bg-primary text-white' : 'border-border bg-background text-foreground/90 hover:border-primary/60',
            )}
          >
            {options[key]}
          </button>
        ))}
      </div>
    </div>
  )
}
