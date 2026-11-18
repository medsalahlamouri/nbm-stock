/*
 * Bouton-icône d'action dans une ligne de tableau (modifier, supprimer, réactiver…), avec infobulle.
 * Le clic ne déclenche pas l'ouverture de la ligne.
 */
import { Link } from 'react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** Bouton-icône d'action dans un tableau, avec infobulle */
export function ActionIcone({ libelle, icone: Icone, onClick, to, ton }) {
  const classes = `inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-surf2 ${ton === 'danger' ? 'text-red hover:bg-dbg' : 'text-ink'}`
  const contenu = <Icone className="size-[17px]" />
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {to ? (
          <Link
            to={to}
            aria-label={libelle}
            className={classes}
            onClick={(e) => e.stopPropagation()}
          >
            {contenu}
          </Link>
        ) : (
          <button
            type="button"
            aria-label={libelle}
            className={classes}
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            {contenu}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent>{libelle}</TooltipContent>
    </Tooltip>
  )
}
