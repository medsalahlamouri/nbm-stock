/*
 * Tableau paginé et triable :
 * en-têtes 12 px majuscules sur fond --surf2, lignes 52 px, colonnes numériques à droite,
 * pagination par 10 lignes avec « lignes 1 à 10 sur N » et pages numérotées.
 *
 * Deux modes :
 * - local : toutes les lignes sont fournies, le tableau trie et découpe lui-même ;
 * - serveur : `serveur={{ total, page, onPage }}`, les lignes reçues sont déjà la page courante.
 */
import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNombre } from '@/lib/format'
import { EtatErreur, SqueletteTableau } from '@/components/commun/Etats'
import { elementCascade, listeCascade } from '@/components/commun/animations'

const ALIGNEMENTS = { left: 'text-left', right: 'text-right', center: 'text-center' }

function comparer(a, b) {
  if (a === b) return 0
  if (a === null || a === undefined || a === '') return 1
  if (b === null || b === undefined || b === '') return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (a instanceof Date && b instanceof Date) return a - b
  return String(a).localeCompare(String(b), 'fr', { numeric: true, sensitivity: 'base' })
}

export function DataTable({
  colonnes,
  lignes,
  cle,
  chargement = false,
  erreur,
  onReessayer,
  vide,
  onLigneClick,
  taillePage = 10,
  libelleElements = 'ligne(s)',
  serveur,
  triInitial,
  classeLigne,
  pied,
  className,
}) {
  const [tri, setTri] = useState(triInitial ?? null)
  const [pageLocale, setPageLocale] = useState(1)
  // Retour à la page 1 quand la liste change (nouveau filtre, nouvelle recherche)
  const [lignesSuivies, setLignesSuivies] = useState(lignes)
  if (lignes !== lignesSuivies) {
    setLignesSuivies(lignes)
    if (!serveur && lignes?.length !== lignesSuivies?.length) setPageLocale(1)
  }

  const triees = useMemo(() => {
    if (serveur || !lignes) return lignes ?? []
    if (!tri) return lignes
    const colonne = colonnes.find((c) => c.id === tri.id)
    if (!colonne?.tri) return lignes
    const copie = [...lignes]
    copie.sort((a, b) => comparer(colonne.tri(a), colonne.tri(b)) * (tri.sens === 'desc' ? -1 : 1))
    return copie
  }, [lignes, tri, colonnes, serveur])

  const total = serveur ? serveur.total : triees.length
  const nbPages = Math.max(1, Math.ceil(total / taillePage))
  const page = Math.min(serveur ? serveur.page : pageLocale, nbPages)
  const changerPage = (p) => (serveur ? serveur.onPage(p) : setPageLocale(p))
  const visibles = serveur ? triees : triees.slice((page - 1) * taillePage, page * taillePage)

  const basculerTri = (colonne) => {
    if (!colonne.tri || serveur) return
    setTri((actuel) => {
      if (actuel?.id !== colonne.id) return { id: colonne.id, sens: 'asc' }
      if (actuel.sens === 'asc') return { id: colonne.id, sens: 'desc' }
      return null
    })
    setPageLocale(1)
  }

  if (chargement) return <SqueletteTableau colonnes={Math.min(colonnes.length, 6)} />
  if (erreur) return <EtatErreur erreur={erreur} onReessayer={onReessayer} />
  if (total === 0) return vide ?? null

  const debut = (page - 1) * taillePage + 1
  const fin = Math.min(page * taillePage, total)

  return (
    <div className={cn('min-w-0', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-line bg-surf2 border-y">
              {colonnes.map((colonne) => {
                const actif = tri?.id === colonne.id
                const Icone = actif ? (tri.sens === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                return (
                  <th
                    key={colonne.id}
                    scope="col"
                    aria-sort={
                      actif ? (tri.sens === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                    className={cn(
                      'text-mutedtxt h-[42px] px-3 text-[12px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase first:pl-[22px] last:pr-[22px]',
                      ALIGNEMENTS[colonne.align ?? 'left'],
                      colonne.classeEntete,
                    )}
                    style={colonne.largeur ? { width: colonne.largeur } : undefined}
                  >
                    {colonne.tri && !serveur ? (
                      <button
                        type="button"
                        onClick={() => basculerTri(colonne)}
                        className={cn(
                          'hover:text-ink inline-flex cursor-pointer items-center gap-1 uppercase',
                          colonne.align === 'right' && 'flex-row-reverse',
                          actif && 'text-ink',
                        )}
                      >
                        {colonne.entete}
                        <Icone
                          className={cn('size-3', !actif && 'opacity-40')}
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      colonne.entete
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <motion.tbody key={`${page}-${tri?.id}-${tri?.sens}`} {...listeCascade}>
            {visibles.map((ligne, index) => (
              <motion.tr
                key={cle(ligne, index)}
                variants={elementCascade.variants}
                onClick={onLigneClick ? () => onLigneClick(ligne) : undefined}
                onKeyDown={
                  onLigneClick
                    ? (e) => {
                        if (e.key === 'Enter' && e.target === e.currentTarget) onLigneClick(ligne)
                      }
                    : undefined
                }
                tabIndex={onLigneClick ? 0 : undefined}
                className={cn(
                  'border-line3 border-b transition-colors last:border-b-0',
                  onLigneClick &&
                    'hover:bg-surf2 focus-visible:bg-surf2 cursor-pointer outline-none',
                  classeLigne?.(ligne),
                )}
              >
                {colonnes.map((colonne) => (
                  <td
                    key={colonne.id}
                    className={cn(
                      'h-[52px] px-3 py-2.5 align-middle first:pl-[22px] last:pr-[22px]',
                      ALIGNEMENTS[colonne.align ?? 'left'],
                      colonne.align === 'right' && 'tabular',
                      colonne.classe,
                    )}
                  >
                    {colonne.cellule(ligne)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t px-[22px] py-3.5">
        <p className="text-mutedtxt text-[13px]">
          {formatNombre(total)} {libelleElements} · lignes {formatNombre(debut)} à{' '}
          {formatNombre(fin)} sur {formatNombre(total)}
          {pied && <span className="ml-2">{pied}</span>}
        </p>
        <Pagination page={page} nbPages={nbPages} onPage={changerPage} />
      </div>
    </div>
  )
}

/** Pagination : « ‹ 1 2 3 › » + « Page p / P » */
export function Pagination({ page, nbPages, onPage }) {
  if (nbPages <= 1) return <span className="text-mutedtxt text-[13px]">Page 1 / 1</span>
  const pages = []
  const debut = Math.max(1, Math.min(page - 2, nbPages - 4))
  for (let p = debut; p <= Math.min(nbPages, debut + 4); p += 1) pages.push(p)
  const bouton =
    'inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <nav className="flex items-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        className={cn(bouton, 'border-line bg-surf hover:bg-surf2')}
        onClick={() => onPage(1)}
        disabled={page === 1}
        aria-label="Première page"
      >
        <ChevronsLeft className="size-4" />
      </button>
      <button
        type="button"
        className={cn(bouton, 'border-line bg-surf hover:bg-surf2')}
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        aria-label="Page précédente"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPage(p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Page ${p}`}
          className={cn(
            bouton,
            p === page
              ? 'border-strong bg-strong text-bg'
              : 'border-line bg-surf text-ink hover:bg-surf2',
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className={cn(bouton, 'border-line bg-surf hover:bg-surf2')}
        onClick={() => onPage(page + 1)}
        disabled={page === nbPages}
        aria-label="Page suivante"
      >
        <ChevronRight className="size-4" />
      </button>
      <button
        type="button"
        className={cn(bouton, 'border-line bg-surf hover:bg-surf2')}
        onClick={() => onPage(nbPages)}
        disabled={page === nbPages}
        aria-label="Dernière page"
      >
        <ChevronsRight className="size-4" />
      </button>
      <span className="text-mutedtxt ml-2 text-[13px] whitespace-nowrap">
        Page {page} / {nbPages}
      </span>
    </nav>
  )
}

/** Cellule « texte principal en gras + sous-ligne 12 px grise » */
export function CellulePrincipale({ titre, sousTitre, avant, className }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      {avant}
      <div className="min-w-0">
        <div className="text-ink truncate font-semibold">{titre}</div>
        {sousTitre && <div className="text-mutedtxt truncate text-[12px]">{sousTitre}</div>}
      </div>
    </div>
  )
}

/** Référence de document en police monospace (CMD-019, FC-2026-0001) */
export function Reference({ children, className }) {
  return (
    <span className={cn('text-ink font-mono text-[13px] font-semibold', className)}>
      {children}
    </span>
  )
}
