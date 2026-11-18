/*
 * Onglets segmentés : fond --seg, onglet actif fond --surf
 * avec ombre, compteur à côté du libellé. L'onglet actif glisse d'une option à l'autre (motion layoutId).
 * Utilisés pour les filtres à peu de choix (état, motif, type, canal, statut).
 */
import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { formatNombre } from '@/lib/format'

export function Onglets({
  options,
  valeur,
  onChange,
  className,
  taille = 'md',
  libelle = 'Filtre',
  pleineLargeur = false,
}) {
  const id = useId()
  return (
    <div
      role="tablist"
      aria-label={libelle}
      className={cn(
        'bg-seg inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[11px] p-1',
        pleineLargeur && 'flex w-full',
        className,
      )}
    >
      {options.map((option) => {
        const actif = option.valeur === valeur
        return (
          <button
            key={String(option.valeur)}
            type="button"
            role="tab"
            aria-selected={actif}
            disabled={option.desactive}
            onClick={() => onChange(option.valeur)}
            className={cn(
              'focus-visible:outline-ink relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-40',
              taille === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-3.5 text-[14px]',
              pleineLargeur && 'flex-1',
              actif ? 'text-ink' : 'text-mutedtxt hover:text-ink',
            )}
          >
            {actif && (
              <motion.span
                layoutId={`onglet-${id}`}
                className="bg-surf shadow-seg absolute inset-0 rounded-lg"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                aria-hidden="true"
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {option.icone && <option.icone className="size-4" aria-hidden="true" />}
              {option.libelle}
              {option.compteur !== undefined && option.compteur !== null && (
                <span className={cn('tabular', actif ? 'text-mutedtxt' : 'text-muted2')}>
                  {formatNombre(option.compteur)}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
