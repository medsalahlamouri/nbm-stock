/*
 * Champ de recherche avec loupe et bouton d'effacement.
 */
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Recherche({ valeur, onChange, placeholder = 'Rechercher…', className, libelle = 'Rechercher' }) {
  return (
    <div className={cn('relative w-full max-w-[420px]', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-mutedtxt" aria-hidden="true" />
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={libelle}
        className="h-11 w-full rounded-[10px] border border-line2 bg-surf pr-9 pl-10 text-[14px] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-muted2 focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-ink [&::-webkit-search-cancel-button]:hidden"
      />
      {valeur && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
          className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-mutedtxt hover:bg-surf2 hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
