/*
 * Badge d'état (docs/DESIGN.md §4) : pastille arrondie 24 px, couleur selon le ton.
 * Les correspondances états du back-end → { libelle, ton } sont dans src/lib/etats.js.
 */
import { cn } from '@/lib/utils'

const TONS = {
  ok: 'bg-okbg text-okfg',
  danger: 'bg-dbg text-dfg',
  warn: 'bg-wbg text-wfg',
  info: 'bg-ibg text-ifg',
  neutral: 'bg-nbg text-nfg',
  dark: 'bg-ink text-bg',
  gold: 'bg-hl text-gold2',
}

export function Badge({ ton = 'neutral', className, children, icone: Icone, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] leading-none font-semibold whitespace-nowrap',
        TONS[ton] ?? TONS.neutral,
        className,
      )}
      {...props}
    >
      {Icone && <Icone className="size-3.5" aria-hidden="true" />}
      {children}
    </span>
  )
}

/** Badge construit à partir d'un objet { libelle, ton } (voir src/lib/etats.js) */
export function BadgeEtat({ etat, className }) {
  if (!etat) return null
  return (
    <Badge ton={etat.ton} className={className}>
      {etat.libelle}
    </Badge>
  )
}
