/*
 * C2 — Produits (/chef/produits).
 * Onglets Matières premières / Articles + recherche + onglets Actifs / Inactifs.
 * Source : v_etat_stock (stock, seuil, état). Actions : voir, modifier,
 * supprimer ou désactiver (rpc supprimer_ou_desactiver), réactiver.
 */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Armchair, Layers, Package, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEtatStock } from '@/hooks/useDonnees'
import { useSuppression } from '@/hooks/useSuppression'
import { correspond, formatMontant, formatNombre } from '@/lib/format'
import { etatStock, statutActif } from '@/lib/etats'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte } from '@/components/commun/Carte'
import { BadgeEtat } from '@/components/commun/Badge'
import { CellulePrincipale, DataTable, Reference } from '@/components/commun/DataTable'
import { EtatVide } from '@/components/commun/Etats'
import { Onglets } from '@/components/commun/Onglets'
import { Recherche } from '@/components/commun/Recherche'
import { ActionIcone } from '@/components/commun/ActionIcone'
import { ConfirmDialog, useConfirmation } from '@/components/commun/Dialogues'

export default function Produits() {
  const naviguer = useNavigate()
  const [parametres, setParametres] = useSearchParams()
  const type = parametres.get('type') === 'ARTICLE' ? 'ARTICLE' : 'MP'
  const [statut, setStatut] = useState('actifs')
  const [recherche, setRecherche] = useState('')
  const stock = useEtatStock()
  const confirmation = useConfirmation()
  const { suppression, reactivation } = useSuppression('produit')

  const tous = stock.data ?? []
  const duType = tous.filter((p) => p.type === type)
  const filtres = duType.filter(
    (p) => (statut === 'tous' || (statut === 'actifs' ? p.actif : !p.actif)) && correspond(recherche, p.code, p.designation, p.unite),
  )
  const mp = type === 'MP'

  const colonnes = [
    { id: 'code', entete: 'Code', tri: (p) => p.code, cellule: (p) => <Reference>{p.code}</Reference>, largeur: 110 },
    { id: 'designation', entete: 'Désignation', tri: (p) => p.designation, cellule: (p) => <CellulePrincipale titre={p.designation} sousTitre={`unité : ${p.unite}`} /> },
    {
      id: 'stock',
      entete: 'Stock',
      align: 'right',
      tri: (p) => p.quantite_stock,
      cellule: (p) => <span className={p.en_alerte && p.actif ? 'font-semibold text-dfg' : 'font-semibold'}>{formatNombre(p.quantite_stock)}</span>,
    },
    {
      id: 'seuil',
      entete: mp ? 'Point de commande' : 'Seuil minimum',
      align: 'right',
      tri: (p) => p.seuil,
      cellule: (p) => (p.seuil === null ? <span className="text-muted2" title="Paramètres de calcul à régler par le gérant">—</span> : formatNombre(p.seuil)),
    },
    ...(mp
      ? [{ id: 'q', entete: 'Q*', align: 'right', tri: (p) => p.quantite_economique, cellule: (p) => (p.quantite_economique ? formatNombre(p.quantite_economique) : '—') }]
      : [{ id: 'prix', entete: 'Prix de vente', align: 'right', tri: (p) => Number(p.prix_vente), cellule: (p) => formatMontant(p.prix_vente) }]),
    {
      id: 'etat',
      entete: 'État',
      tri: (p) => p.etat,
      cellule: (p) => (p.actif ? <BadgeEtat etat={etatStock(p.etat)} /> : <BadgeEtat etat={statutActif(false)} />),
    },
    {
      id: 'actions',
      entete: 'Actions',
      align: 'right',
      cellule: (p) => (
        <div className="flex justify-end gap-1">
          <ActionIcone libelle="Modifier" icone={Pencil} to={`/chef/produits/${p.id_produit}/modifier`} />
          {p.actif ? (
            <ActionIcone libelle="Supprimer ou désactiver" icone={Trash2} ton="danger" onClick={() => confirmation.ouvrir(p)} />
          ) : (
            <ActionIcone libelle="Réactiver" icone={RotateCcw} onClick={() => reactivation.mutate(p.id_produit)} />
          )}
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Produits"
        description="Les matières premières consommées par l'atelier et les articles fabriqués et vendus par NBM."
        actions={
          <Button asChild>
            <Link to={`/chef/produits/nouveau?type=${type}`}>
              <Plus /> Nouveau produit
            </Link>
          </Button>
        }
      />
      <Onglets
        valeur={type}
        onChange={(v) => setParametres({ type: v }, { replace: true })}
        libelle="Type de produit"
        options={[
          { valeur: 'MP', libelle: 'Matières premières', icone: Layers, compteur: tous.filter((p) => p.type === 'MP' && p.actif).length },
          { valeur: 'ARTICLE', libelle: 'Articles', icone: Armchair, compteur: tous.filter((p) => p.type === 'ARTICLE' && p.actif).length },
        ]}
        className="self-start"
      />
      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
          <Recherche valeur={recherche} onChange={setRecherche} placeholder="Code, désignation, unité" />
          <Onglets
            valeur={statut}
            onChange={setStatut}
            libelle="Statut"
            options={[
              { valeur: 'actifs', libelle: 'Actifs', compteur: duType.filter((p) => p.actif).length },
              { valeur: 'inactifs', libelle: 'Inactifs', compteur: duType.filter((p) => !p.actif).length },
              { valeur: 'tous', libelle: 'Tous', compteur: duType.length },
            ]}
          />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={filtres}
          cle={(p) => p.id_produit}
          chargement={stock.isPending}
          erreur={stock.error}
          onReessayer={stock.refetch}
          onLigneClick={(p) => naviguer(`/chef/produits/${p.id_produit}`)}
          libelleElements={mp ? 'matière(s) première(s)' : 'article(s)'}
          classeLigne={(p) => (!p.actif ? 'opacity-70' : '')}
          vide={
            <EtatVide
              icone={Package}
              titre={duType.length ? 'Aucun produit ne correspond' : mp ? 'Aucune matière première' : 'Aucun article'}
              message={duType.length ? 'Modifiez la recherche ou le filtre.' : 'Ajoutez un premier produit avec son stock initial.'}
              action={
                !duType.length && (
                  <Button asChild>
                    <Link to={`/chef/produits/nouveau?type=${type}`}>
                      <Plus /> Nouveau produit
                    </Link>
                  </Button>
                )
              }
            />
          }
        />
      </Carte>
      <ConfirmDialog
        {...confirmation.proprietes}
        titre={`Supprimer « ${confirmation.cible?.designation ?? ''} » ?`}
        message="Un produit qui a des mouvements, des devis ou des ventes est seulement désactivé : son historique est conservé."
        libelleConfirmer="Supprimer ou désactiver"
        onConfirmer={() => suppression.mutateAsync(confirmation.cible.id_produit)}
      />
    </Page>
  )
}
