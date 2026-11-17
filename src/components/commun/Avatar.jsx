/*
 * Avatar rond : photo du bucket privé `photos` (URL signée) ou initiales sur fond sombre.
 * InitialesCarre : carré arrondi avec initiales (listes de fournisseurs, clients).
 */
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { initiales } from '@/lib/format'
import { urlPhoto } from '@/api/utilisateurs'

export function Avatar({ utilisateur, taille = 38, clair = false, className }) {
  const chemin = utilisateur?.photo
  const { data: url } = useQuery({
    queryKey: ['photo', chemin],
    queryFn: () => urlPhoto(chemin),
    enabled: Boolean(chemin),
    staleTime: 50 * 60_000,
  })
  const texte = initiales(utilisateur?.prenom, utilisateur?.nom)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold select-none',
        clair ? 'bg-sideav text-sideavt' : 'bg-strong text-bg',
        className,
      )}
      style={{ width: taille, height: taille, fontSize: Math.round(taille * 0.36) }}
      aria-hidden="true"
    >
      {url ? <img src={url} alt="" className="size-full object-cover" /> : texte}
    </span>
  )
}

export function InitialesCarre({ texte, className }) {
  return (
    <span
      className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-nbg text-[12px] font-semibold text-nfg', className)}
      aria-hidden="true"
    >
      {initiales(texte)}
    </span>
  )
}
