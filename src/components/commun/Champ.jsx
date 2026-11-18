/*
 * Champ de formulaire : libellé au-dessus (13 px, 600, --ink2), aide en dessous, message d'erreur.
 * Relie le libellé au champ (htmlFor) et le message d'erreur (aria-describedby) pour l'accessibilité.
 */
import { cloneElement, createContext, isValidElement, useContext, useId } from 'react'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Transmet l'identifiant du champ aux composants placés dans un <Controller> (combobox, onglets),
// pour que le libellé et les messages leur soient reliés.
const ChampContext = createContext(null)

/** Identifiant et attributs d'accessibilité du champ englobant (null hors d'un <Champ>) */
// oxlint-disable-next-line react/only-export-components
export const useChamp = () => useContext(ChampContext)

export function Champ({
  libelle,
  obligatoire,
  erreur,
  aide,
  verrouille,
  infoVerrou,
  className,
  children,
  droite,
  modifie = false,
}) {
  const id = useId()
  const idAide = `${id}-aide`
  const idErreur = `${id}-erreur`
  const decrit = [aide && idAide, erreur && idErreur].filter(Boolean).join(' ') || undefined
  const enfant = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        'aria-invalid': erreur ? true : undefined,
        'aria-describedby': decrit,
        // Champ modifié signalé en doré (formulaires de modification)
        className: cn(children.props.className, modifie && !erreur && 'border-gold2 bg-hl'),
      })
    : children

  return (
    <ChampContext.Provider
      value={{ id: children?.props?.id ?? id, decrit, invalide: Boolean(erreur) }}
    >
      <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
        {libelle && (
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={children?.props?.id ?? id}
              className="text-ink2 inline-flex items-center gap-1.5 text-[13px] font-semibold"
            >
              {libelle}
              {obligatoire && (
                <span className="text-red" aria-hidden="true">
                  *
                </span>
              )}
              {modifie && (
                <span className="bg-gold2 size-1.5 rounded-full" title="Champ modifié">
                  <span className="sr-only">(modifié)</span>
                </span>
              )}
              {verrouille && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      tabIndex={0}
                      className="text-mutedtxt inline-flex"
                      aria-label={infoVerrou ?? 'Champ verrouillé'}
                    >
                      <Lock className="size-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{infoVerrou ?? 'Champ verrouillé'}</TooltipContent>
                </Tooltip>
              )}
            </label>
            {droite}
          </div>
        )}
        {enfant}
        {aide && !erreur && (
          <p id={idAide} className="text-mutedtxt text-[12px]">
            {aide}
          </p>
        )}
        {erreur && (
          <p id={idErreur} className="text-dfg text-[12px] font-medium" role="alert">
            {erreur}
          </p>
        )}
      </div>
    </ChampContext.Provider>
  )
}
