/*
 * Champ de recherche avec loupe et bouton d'effacement.
 */
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Recherche({
  valeur,
  onChange,
  placeholder = 'Rechercher…',
  className,
  libelle = 'Rechercher',
}) {
  return (
    <div className={cn('relative w-full max-w-[420px]', className)}>
      <Search
        className="text-mutedtxt pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={libelle}
        className="border-line2 bg-surf text-ink placeholder:text-muted2 focus-visible:border-ink focus-visible:ring-ink h-11 w-full rounded-[10px] border pr-9 pl-10 text-[14px] transition-[border-color,box-shadow] outline-none focus-visible:ring-1 [&::-webkit-search-cancel-button]:hidden"
      />
      {valeur && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
          className="text-mutedtxt hover:bg-surf2 hover:text-ink absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
