/*
 * Tête de page (docs/DESIGN.md §3) : titre h1 Fraunces 30 px + phrase d'introduction à gauche,
 * boutons d'action à droite.
 */
import { cn } from '@/lib/utils'

export function PageEntete({ titre, description, actions, badges, className }) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}>
      <div className="max-w-3xl min-w-0">
        <h1 className="font-serif text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] text-strong">{titre}</h1>
        {description && <p className="mt-2 text-[15px] leading-normal text-mutedtxt">{description}</p>}
      </div>
      {(actions || badges) && (
        <div className="flex flex-wrap items-center gap-2.5">
          {badges}
          {actions}
        </div>
      )}
    </header>
  )
}

/** Conteneur d'une page : espacement vertical 22 px entre les blocs */
export function Page({ className, children }) {
  return <div className={cn('flex flex-col gap-[22px]', className)}>{children}</div>
}
