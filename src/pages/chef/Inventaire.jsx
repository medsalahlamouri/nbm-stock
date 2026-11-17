/*
 * C6 — Inventaire (/chef/inventaire).
 * Onglets MP / Articles ; tableau : produit, stock enregistré, quantité comptée (champ), écart coloré.
 * « Valider l'inventaire » → fenêtre récapitulative des ajustements → confirmation →
 * rpc('enregistrer_inventaire', { p_lignes }) avec les lignes saisies uniquement → « n ajustement(s) ».
 */
import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Armchair, ClipboardCheck, Eraser, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { enregistrerInventaire } from '@/api/stock'
import { useEtatStock } from '@/hooks/useDonnees'
import { correspond, formatNombre } from '@/lib/format'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, GrilleIndicateurs } from '@/components/commun/Carte'
import { StatCard } from '@/components/commun/StatCard'
import { CellulePrincipale, DataTable } from '@/components/commun/DataTable'
import { EtatVide } from '@/components/commun/Etats'
import { Encart } from '@/components/commun/Encart'
import { Onglets } from '@/components/commun/Onglets'
import { Recherche } from '@/components/commun/Recherche'
import { ConfirmDialog } from '@/components/commun/Dialogues'

function Ecart({ valeur }) {
  if (valeur === null) return <span className="text-muted2">—</span>
  if (valeur === 0) return <span className="font-medium text-okfg">0</span>
  return <span className={cn('font-semibold', valeur > 0 ? 'text-okfg' : 'text-dfg')}>{valeur > 0 ? `+${formatNombre(valeur)}` : `−${formatNombre(Math.abs(valeur))}`}</span>
}

export default function Inventaire() {
  const stock = useEtatStock()
  const [type, setType] = useState('MP')
  const [recherche, setRecherche] = useState('')
  const [comptes, setComptes] = useState({})
  const [confirmer, setConfirmer] = useState(false)

  const produits = useMemo(() => (stock.data ?? []).filter((p) => p.actif), [stock.data])
  const saisis = useMemo(
    () =>
      produits
        .filter((p) => comptes[p.id_produit] !== undefined && comptes[p.id_produit] !== '')
        .map((p) => ({ ...p, compte: Number(comptes[p.id_produit]), ecart: Number(comptes[p.id_produit]) - p.quantite_stock })),
    [produits, comptes],
  )
  const ajustements = saisis.filter((l) => l.ecart !== 0)
  const filtres = produits.filter((p) => p.type === type && correspond(recherche, p.code, p.designation))

  const inventaire = useMutation({
    mutationFn: () => enregistrerInventaire(saisis.map((l) => ({ id_produit: l.id_produit, quantite_comptee: l.compte }))),
    onSuccess: async (resultat) => {
      await invalider('stock')
      const n = resultat?.ajustements ?? ajustements.length
      if (n > 0) toast.success(`Inventaire validé : ${formatNombre(n)} ajustement(s) enregistré(s).`)
      else toast.success('Inventaire validé : aucun ajustement nécessaire.')
      setComptes({})
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const colonnes = [
    { id: 'produit', entete: 'Produit', tri: (p) => p.designation, cellule: (p) => <CellulePrincipale titre={p.designation} sousTitre={`${p.code} · ${p.unite}`} /> },
    { id: 'stock', entete: 'Stock enregistré', align: 'right', tri: (p) => p.quantite_stock, cellule: (p) => <span className="font-semibold">{formatNombre(p.quantite_stock)}</span> },
    {
      id: 'compte',
      entete: 'Quantité comptée',
      align: 'right',
      cellule: (p) => (
        <input
          type="text"
          inputMode="numeric"
          aria-label={`Quantité comptée pour ${p.designation}`}
          placeholder="—"
          value={comptes[p.id_produit] ?? ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d]/g, '')
            setComptes((c) => ({ ...c, [p.id_produit]: v }))
          }}
          className={cn(
            'h-9 w-28 rounded-lg border bg-surf px-3 text-right text-[14px] tabular outline-none focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-ink',
            comptes[p.id_produit] ? 'border-gold2 bg-hl' : 'border-line2',
          )}
        />
      ),
    },
    {
      id: 'ecart',
      entete: 'Écart',
      align: 'right',
      cellule: (p) => <Ecart valeur={comptes[p.id_produit] ? Number(comptes[p.id_produit]) - p.quantite_stock : null} />,
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Inventaire"
        description="Saisissez les quantités comptées : les écarts avec le stock enregistré deviennent des mouvements « Inventaire » à la validation. Seules les lignes saisies sont prises en compte."
        actions={
          <>
            {saisis.length > 0 && (
              <Button variant="ghost" onClick={() => setComptes({})}>
                <Eraser /> Effacer la saisie
              </Button>
            )}
            <Button onClick={() => setConfirmer(true)} disabled={saisis.length === 0}>
              <ClipboardCheck /> Valider l'inventaire
            </Button>
          </>
        }
      />
      <GrilleIndicateurs>
        <StatCard libelle="Lignes comptées" valeur={saisis.length} sousTexte={`sur ${formatNombre(produits.length)} produits actifs`} icone={ClipboardCheck} />
        <StatCard libelle="Écarts constatés" valeur={ajustements.length} sousTexte="deviendront des ajustements" icone={Eraser} ton={ajustements.length ? 'warn' : 'ok'} />
        <StatCard libelle="Excédents" valeur={ajustements.filter((l) => l.ecart > 0).reduce((t, l) => t + l.ecart, 0)} sousTexte="unités en plus" ton="ok" icone={Layers} />
        <StatCard libelle="Manquants" valeur={ajustements.filter((l) => l.ecart < 0).reduce((t, l) => t - l.ecart, 0)} sousTexte="unités en moins" ton="danger" icone={Armchair} />
      </GrilleIndicateurs>
      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
          <Onglets
            valeur={type}
            onChange={setType}
            libelle="Type de produit"
            options={[
              { valeur: 'MP', libelle: 'Matières premières', icone: Layers, compteur: saisis.filter((l) => l.type === 'MP').length },
              { valeur: 'ARTICLE', libelle: 'Articles', icone: Armchair, compteur: saisis.filter((l) => l.type === 'ARTICLE').length },
            ]}
          />
          <Recherche valeur={recherche} onChange={setRecherche} placeholder="Code ou désignation" className="sm:w-[300px]" />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={filtres}
          cle={(p) => p.id_produit}
          chargement={stock.isPending}
          erreur={stock.error}
          onReessayer={stock.refetch}
          libelleElements="produit(s)"
          taillePage={10}
          vide={<EtatVide icone={ClipboardCheck} titre="Aucun produit" message="Aucun produit actif ne correspond." />}
        />
      </Carte>

      <ConfirmDialog
        ouvert={confirmer}
        onOuvertChange={setConfirmer}
        ton="principal"
        titre="Valider l'inventaire ?"
        message={
          ajustements.length
            ? `${formatNombre(saisis.length)} ligne(s) comptée(s), dont ${formatNombre(ajustements.length)} avec un écart : chaque écart crée un mouvement « Inventaire » et corrige le stock.`
            : `${formatNombre(saisis.length)} ligne(s) comptée(s), aucun écart : aucun ajustement nécessaire.`
        }
        libelleConfirmer="Valider l'inventaire"
        onConfirmer={() => inventaire.mutateAsync()}
      >
        {ajustements.length > 0 ? (
          <div className="max-h-[260px] overflow-y-auto rounded-xl border border-line">
            <table className="w-full text-[13px]">
              <thead className="bg-surf2 text-[11px] font-semibold tracking-[0.04em] text-mutedtxt uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Produit</th>
                  <th className="px-3 py-2 text-right">Enregistré</th>
                  <th className="px-3 py-2 text-right">Compté</th>
                  <th className="px-3 py-2 text-right">Écart</th>
                </tr>
              </thead>
              <tbody>
                {ajustements.map((l) => (
                  <tr key={l.id_produit} className="border-t border-line3">
                    <td className="px-3 py-2">{l.designation}</td>
                    <td className="px-3 py-2 text-right tabular">{formatNombre(l.quantite_stock)}</td>
                    <td className="px-3 py-2 text-right tabular">{formatNombre(l.compte)}</td>
                    <td className="px-3 py-2 text-right tabular">
                      <Ecart valeur={l.ecart} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Encart ton="ok">Aucun ajustement nécessaire : les quantités comptées correspondent au stock enregistré.</Encart>
        )}
      </ConfirmDialog>
    </Page>
  )
}
