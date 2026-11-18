/*
 * Combobox : champ de recherche + liste filtrée, insensible aux accents et à la casse,
 * avec sous-libellé grisé. Utilisée pour les listes longues (produits, fournisseurs, clients).
 * Construite sur les composants shadcn/ui Popover et Command (cmdk).
 */
import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { correspond } from '@/lib/format'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useChamp } from '@/components/commun/Champ'

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
  const champ = useChamp()
  const choisie = options.find((o) => String(o.valeur) === String(valeur))

  return (
    <Popover open={ouvert} onOpenChange={setOuvert}>
      <PopoverTrigger asChild>
        <button
          id={id ?? champ?.id}
          type="button"
          role="combobox"
          aria-expanded={ouvert}
          aria-invalid={invalide || champ?.invalide || undefined}
          aria-describedby={champ?.decrit}
          aria-label={libelle}
          disabled={disabled}
          className={cn(
            'border-line2 bg-surf focus-visible:border-ink focus-visible:ring-ink disabled:bg-surf2 disabled:text-mutedtxt aria-invalid:border-red flex h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[10px] border px-3 text-left text-[14px] transition-[border-color,box-shadow] outline-none focus-visible:ring-1 disabled:cursor-not-allowed',
            className,
          )}
        >
          {choisie ? (
            <span className="flex min-w-0 items-baseline gap-2 truncate">
              <span className="text-ink truncate">{choisie.libelle}</span>
              {choisie.sousLibelle && (
                <span className="text-mutedtxt truncate text-[12px]">{choisie.sousLibelle}</span>
              )}
            </span>
          ) : (
            <span className="text-muted2 truncate">{placeholder}</span>
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
                className="text-mutedtxt hover:bg-surf2 hover:text-ink inline-flex size-6 items-center justify-center rounded-md"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronsUpDown className="text-mutedtxt size-4" aria-hidden="true" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0"
        align="start"
      >
        <Command
          filter={(_valeur, recherche, motsCles) =>
            correspond(recherche, ...(motsCles ?? [])) ? 1 : 0
          }
        >
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
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      String(option.valeur) === String(valeur) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-ink truncate text-[14px]">{option.libelle}</span>
                    {option.sousLibelle && (
                      <span className="text-mutedtxt truncate text-[12px]">
                        {option.sousLibelle}
                      </span>
                    )}
                  </span>
                  {option.droite && (
                    <span className="text-mutedtxt shrink-0 text-[12px]">{option.droite}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
