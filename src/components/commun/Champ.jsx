/*
 * Champ de formulaire : libellé au-dessus (13 px, 600, --ink2), aide en dessous, message d'erreur.
 * Relie le libellé au champ (htmlFor) et le message d'erreur (aria-describedby) pour l'accessibilité.
 */
import { cloneElement, isValidElement, useId } from 'react'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function Champ({ libelle, obligatoire, erreur, aide, verrouille, infoVerrou, className, children, droite }) {
  const id = useId()
  const idAide = `${id}-aide`
  const idErreur = `${id}-erreur`
  const decrit = [aide && idAide, erreur && idErreur].filter(Boolean).join(' ') || undefined
  const enfant = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        'aria-invalid': erreur ? true : undefined,
        'aria-describedby': decrit,
      })
    : children

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {libelle && (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={children?.props?.id ?? id} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink2">
            {libelle}
            {obligatoire && <span className="text-red" aria-hidden="true">*</span>}
            {verrouille && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex text-mutedtxt" aria-label={infoVerrou ?? 'Champ verrouillé'}>
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
        <p id={idAide} className="text-[12px] text-mutedtxt">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={idErreur} className="text-[12px] font-medium text-dfg" role="alert">
          {erreur}
        </p>
      )}
    </div>
  )
}
