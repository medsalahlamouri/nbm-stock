/*
 * Carte indicateur (docs/DESIGN.md §4) : libellé, pastille d'icône colorée, valeur 28 px animée, sous-texte.
 * Cliquable si `to` est fourni (légère élévation au survol).
 */
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { animate, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { formatNombre } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { apparition } from '@/components/commun/animations'

const TONS_PASTILLE = {
  ok: 'bg-okbg text-okfg',
  danger: 'bg-dbg text-dfg',
  warn: 'bg-wbg text-wfg',
  info: 'bg-ibg text-ifg',
  neutral: 'bg-nbg text-nfg',
  dark: 'bg-ink text-bg',
}

/** Pastille d'icône carrée arrondie (34 px dans les indicateurs, 40 px dans les alertes) */
export function Pastille({ icone: Icone, ton = 'neutral', taille = 34, className }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        TONS_PASTILLE[ton],
        className,
      )}
      style={{ width: taille, height: taille, borderRadius: taille >= 40 ? 11 : 10 }}
      aria-hidden="true"
    >
      {Icone && <Icone className={taille >= 40 ? 'size-[18px]' : 'size-4'} />}
    </span>
  )
}

/** Nombre qui s'anime de 0 (ou de sa valeur précédente) jusqu'à sa valeur, au format français */
const formaterDefaut = (v) => formatNombre(v)

export function NombreAnime({ valeur, formater = formaterDefaut, duree = 0.5 }) {
  const ref = useRef(null)
  const precedent = useRef(0)
  const reduit = useReducedMotion()

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const cible = Number(valeur ?? 0)
    if (reduit) {
      element.textContent = formater(cible)
      precedent.current = cible
      return undefined
    }
    const controle = animate(precedent.current, cible, {
      duration: duree,
      ease: 'easeOut',
      onUpdate: (v) => {
        element.textContent = formater(Number.isInteger(cible) ? Math.round(v) : v)
      },
    })
    precedent.current = cible
    return () => controle.stop()
  }, [valeur, reduit, formater, duree])

  return (
    <span ref={ref} className="tabular">
      {formater(0)}
    </span>
  )
}

export function StatCard({
  libelle,
  valeur,
  formater,
  sousTexte,
  icone,
  ton = 'neutral',
  to,
  chargement,
  className,
  children,
}) {
  const contenu = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-mutedtxt text-[13px] font-medium">{libelle}</span>
        {icone && <Pastille icone={icone} ton={ton} />}
      </div>
      {chargement ? (
        <>
          <Skeleton className="mt-1 h-8 w-24" />
          <Skeleton className="h-4 w-36" />
        </>
      ) : (
        <>
          <div className="text-strong tabular text-[28px] leading-none font-semibold tracking-[-0.02em]">
            {typeof valeur === 'number' ? (
              <NombreAnime valeur={valeur} formater={formater} />
            ) : (
              (valeur ?? '—')
            )}
          </div>
          {sousTexte && <p className="text-mutedtxt text-[13px] leading-snug">{sousTexte}</p>}
          {children}
        </>
      )}
    </>
  )
  const classes = cn(
    'flex min-w-0 flex-col gap-3 rounded-[14px] border border-line bg-surf px-5 py-[18px] shadow-card transition-[box-shadow,border-color,transform] duration-200',
    to &&
      'cursor-pointer hover:-translate-y-px hover:border-line2 hover:shadow-hover focus-visible:border-ink',
    className,
  )
  if (to) {
    return (
      <motion.div {...apparition} className="min-w-0">
        <Link to={to} className={cn(classes, 'h-full')}>
          {contenu}
        </Link>
      </motion.div>
    )
  }
  return (
    <motion.div {...apparition} className={classes}>
      {contenu}
    </motion.div>
  )
}
