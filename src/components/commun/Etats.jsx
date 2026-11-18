/*
 * États d'un écran : chargement (squelettes), vide (message + action), erreur.
 */
import { motion } from 'motion/react'
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { messageErreur } from '@/lib/erreurs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { apparition } from '@/components/commun/animations'

export function EtatVide({
  icone: Icone = Inbox,
  titre,
  message,
  action,
  className,
  compact = false,
}) {
  return (
    <motion.div
      {...apparition}
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 text-center',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      <span className="bg-surf2 text-mutedtxt ring-line inline-flex size-12 items-center justify-center rounded-[14px] ring-1">
        <Icone className="size-5" aria-hidden="true" />
      </span>
      <div className="max-w-md">
        <p className="text-ink text-[15px] font-semibold">{titre}</p>
        {message && <p className="text-mutedtxt mt-1 text-[13px]">{message}</p>}
      </div>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </motion.div>
  )
}

export function EtatErreur({
  erreur,
  onReessayer,
  titre = 'Impossible de charger les données',
  className,
}) {
  return (
    <motion.div
      {...apparition}
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="bg-dbg text-dfg inline-flex size-12 items-center justify-center rounded-[14px]">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <div className="max-w-md">
        <p className="text-ink text-[15px] font-semibold">{titre}</p>
        <p className="text-mutedtxt mt-1 text-[13px]">{messageErreur(erreur)}</p>
      </div>
      {onReessayer && (
        <Button variant="outline" size="sm" onClick={() => onReessayer()}>
          <RefreshCw /> Réessayer
        </Button>
      )}
    </motion.div>
  )
}

/** Squelette de tableau : en-tête + lignes aux dimensions de la maquette */
export function SqueletteTableau({ lignes = 6, colonnes = 5 }) {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <div className="border-line bg-surf2 flex h-[42px] items-center gap-6 border-y px-[22px]">
        {Array.from({ length: colonnes }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="border-line3 flex h-[52px] items-center gap-6 border-b px-[22px]">
          {Array.from({ length: colonnes }, (_, j) => (
            <Skeleton key={j} className={cn('h-3.5 flex-1', j === 0 && 'max-w-[220px]')} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Squelette de bloc générique */
export function SqueletteBloc({ hauteur = 220, className }) {
  return (
    <div
      className={cn('border-line bg-surf rounded-[14px] border p-[22px]', className)}
      aria-busy="true"
      aria-label="Chargement"
    >
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-3 w-64" />
      <Skeleton className="mt-5 w-full" style={{ height: hauteur }} />
    </div>
  )
}

/** Squelette d'une page de formulaire */
export function SqueletteFormulaire({ champs = 6 }) {
  return (
    <div
      className="border-line bg-surf rounded-[14px] border p-[22px]"
      aria-busy="true"
      aria-label="Chargement"
    >
      <Skeleton className="h-5 w-48" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: champs }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
