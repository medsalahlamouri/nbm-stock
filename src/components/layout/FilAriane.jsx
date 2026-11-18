/*
 * Fil d'Ariane (« Achats / Fournisseurs / Modifier »).
 * Chaque route déclare son fil dans `handle.fil` (src/routes.jsx). Une page peut remplacer le dernier
 * élément par un libellé dynamique (ex. nom du fournisseur) avec le hook useFilAriane.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { Link, useMatches } from 'react-router'
import { cn } from '@/lib/utils'

const FilContext = createContext({ dernier: null, setDernier: () => {} })

export function FilProvider({ children }) {
  const [dernier, setDernier] = useState(null)
  return <FilContext.Provider value={{ dernier, setDernier }}>{children}</FilContext.Provider>
}

/** Remplace le dernier élément du fil par `libelle` tant que la page est affichée */
// oxlint-disable-next-line react/only-export-components
export function useFilAriane(libelle) {
  const { setDernier } = useContext(FilContext)
  useEffect(() => {
    if (libelle) setDernier(libelle)
    return () => setDernier(null)
  }, [libelle, setDernier])
}

export function FilAriane({ className }) {
  const matches = useMatches()
  const { dernier } = useContext(FilContext)
  const avecFil = [...matches].reverse().find((m) => m.handle?.fil)
  const elements = (avecFil?.handle.fil ?? []).map((e) =>
    typeof e === 'string' ? { libelle: e } : e,
  )
  if (dernier && elements.length) elements[elements.length - 1] = { libelle: dernier }

  return (
    <nav aria-label="Fil d'Ariane" className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 items-center gap-2 text-[14px]">
        {elements.map((element, index) => {
          const estDernier = index === elements.length - 1
          return (
            <li
              key={`${element.libelle}-${index}`}
              className={cn('flex min-w-0 items-center gap-2', !estDernier && 'hidden sm:flex')}
            >
              {index > 0 && (
                <span className="text-muted2" aria-hidden="true">
                  /
                </span>
              )}
              {estDernier ? (
                <span aria-current="page" className="text-ink truncate font-medium">
                  {element.libelle}
                </span>
              ) : element.to ? (
                <Link
                  to={element.to}
                  className="text-mutedtxt hover:text-ink truncate transition-colors"
                >
                  {element.libelle}
                </Link>
              ) : (
                <span className="text-mutedtxt truncate">{element.libelle}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
