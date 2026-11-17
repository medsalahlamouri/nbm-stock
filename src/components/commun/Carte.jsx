/*
 * Carte / section (docs/DESIGN.md §4) : fond --surf, bordure --line, rayon 14 px, padding 22 px.
 * CarteEntete : titre h2 16 px + description en --muted + action à droite.
 */
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { apparition } from '@/components/commun/animations'

export function Carte({ className, children, sansPadding = false, as = 'section', anime = true, ...props }) {
  const Composant = anime ? motion[as] : as
  return (
    <Composant
      {...(anime ? apparition : {})}
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-[14px] border border-line bg-surf shadow-card',
        !sansPadding && 'p-[22px]',
        className,
      )}
      {...props}
    >
      {children}
    </Composant>
  )
}

export function CarteEntete({ titre, description, action, className, icone }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-2', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icone}
        <div className="min-w-0">
          <h2 className="text-[16px] leading-snug font-semibold text-ink">{titre}</h2>
          {description && <p className="mt-0.5 text-[13px] text-mutedtxt">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

/** Grille de blocs de la maquette : repeat(auto-fit, minmax(min(100%, 460px), 1fr)) */
export function GrilleBlocs({ className, children }) {
  return (
    <div className={cn('grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-start gap-[18px]', className)}>
      {children}
    </div>
  )
}

/** Grille d'indicateurs : repeat(auto-fit, minmax(210px, 1fr)) */
export function GrilleIndicateurs({ className, children }) {
  return <div className={cn('grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4', className)}>{children}</div>
}

/** Petite tuile chiffrée sur fond --surf2 (synthèses, évaluation) */
export function Tuile({ libelle, valeur, className, ton }) {
  const couleurs = { danger: 'text-dfg', ok: 'text-okfg', warn: 'text-wfg', info: 'text-ifg' }
  return (
    <div className={cn('min-w-0 rounded-xl border border-line bg-surf2 px-4 py-3.5', className)}>
      <p className="truncate text-[13px] text-mutedtxt">{libelle}</p>
      <p className={cn('mt-1 truncate text-[22px] leading-tight font-semibold tracking-[-0.01em] text-strong tabular', couleurs[ton])}>{valeur}</p>
    </div>
  )
}

/** Ligne « libellé … valeur » des récapitulatifs */
export function LigneInfo({ libelle, children, className, fort = false }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 py-1.5', className)}>
      <dt className="text-[14px] text-mutedtxt">{libelle}</dt>
      <dd className={cn('text-right text-[14px] text-ink tabular', fort && 'font-semibold')}>{children}</dd>
    </div>
  )
}
