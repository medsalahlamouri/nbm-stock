/*
 * Combobox (docs/DESIGN.md §4) : champ de recherche + liste filtrée, insensible aux accents et à la casse,
 * avec sous-libellé grisé. Utilisée pour les listes longues (produits, fournisseurs, clients) — règle §13.
 * Construite sur les composants shadcn/ui Popover et Command (cmdk).
 */
import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { correspond } from '@/lib/format'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

/**
 * @param {{ valeur: string|number|null, onChange: (valeur) => void,
 *   options: { valeur: string|number, libelle: string, sousLibelle?: string, droite?: React.ReactNode, desactive?: boolean }[],
 *   placeholder?: string, recherchePlaceholder?: string, vide?: string, effacable?: boolean, id?: string, invalide?: boolean }} props
 */
export function Combobox({
  valeur,
  onChange,
  options,
  placeholder = 'Choisir…',
  recherchePlaceholder = 'Rechercher…',
  vide = 'Aucun résultat',
  effacable = false,
  disabled = false,
  className,
  id,
  invalide,
  libelle,
}) {
  const [ouvert, setOuvert] = useState(false)
  const choisie = options.find((o) => String(o.valeur) === String(valeur))

  return (
    <Popover open={ouvert} onOpenChange={setOuvert}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={ouvert}
          aria-invalid={invalide || undefined}
          aria-label={libelle}
          disabled={disabled}
          className={cn(
            'flex h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-line2 bg-surf px-3 text-left text-[14px] transition-[border-color,box-shadow] outline-none focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-ink disabled:cursor-not-allowed disabled:bg-surf2 disabled:text-mutedtxt aria-invalid:border-red',
            className,
          )}
        >
          {choisie ? (
            <span className="flex min-w-0 items-baseline gap-2 truncate">
              <span className="truncate text-ink">{choisie.libelle}</span>
              {choisie.sousLibelle && <span className="truncate text-[12px] text-mutedtxt">{choisie.sousLibelle}</span>}
            </span>
          ) : (
            <span className="truncate text-muted2">{placeholder}</span>
          )}
          <span className="flex shrink-0 items-center gap-1">
            {effacable && choisie && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Effacer la sélection"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    onChange(null)
                  }
                }}
                className="inline-flex size-6 items-center justify-center rounded-md text-mutedtxt hover:bg-surf2 hover:text-ink"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronsUpDown className="size-4 text-mutedtxt" aria-hidden="true" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0" align="start">
        <Command filter={(_valeur, recherche, motsCles) => (correspond(recherche, ...(motsCles ?? [])) ? 1 : 0)}>
          <CommandInput placeholder={recherchePlaceholder} />
          <CommandList>
            <CommandEmpty>{vide}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={String(option.valeur)}
                  value={String(option.valeur)}
                  keywords={[option.libelle, option.sousLibelle ?? '']}
                  disabled={option.desactive}
                  onSelect={() => {
                    onChange(option.valeur)
                    setOuvert(false)
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <Check className={cn('size-4 shrink-0', String(option.valeur) === String(valeur) ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[14px] text-ink">{option.libelle}</span>
                    {option.sousLibelle && <span className="truncate text-[12px] text-mutedtxt">{option.sousLibelle}</span>}
                  </span>
                  {option.droite && <span className="shrink-0 text-[12px] text-mutedtxt">{option.droite}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
