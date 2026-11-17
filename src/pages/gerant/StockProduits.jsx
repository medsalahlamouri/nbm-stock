/*
 * B2 / B3 — Stock des matières premières et des articles (gérant, lecture seule).
 * Source : v_etat_stock filtrée sur le type (produits actifs). Indicateurs, courbe d'évolution du produit
 * choisi (icône « courbe » du tableau), recherche + onglets d'état, tableau paginé.
 * MP : stock, PC, Q*, couverture, état, « Commander ». Articles : stock, seuil, prix, valeur, vendus / produits 90 j.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ChartColumn, ChevronRight, ClipboardList, Layers, TriangleAlert, Wallet, Armchair } from 'lucide-react'
import { useEtatStock, usePrixAchat } from '@/hooks/useDonnees'
import { correspond, formatMontant, formatMontantArrondi, formatNombre } from '@/lib/format'
import { etatStock } from '@/lib/etats'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, GrilleIndicateurs } from '@/components/commun/Carte'
import { StatCard } from '@/components/commun/StatCard'
import { BadgeEtat } from '@/components/commun/Badge'
import { CellulePrincipale, DataTable } from '@/components/commun/DataTable'
import { EtatVide, SqueletteBloc } from '@/components/commun/Etats'
import { Onglets } from '@/components/commun/Onglets'
import { Recherche } from '@/components/commun/Recherche'
import { EvolutionStock } from '@/components/commun/EvolutionStock'

export function StockProduits({ type }) {
  const mp = type === 'MP'
  const stock = useEtatStock()
  const prix = usePrixAchat()
  const [recherche, setRecherche] = useState('')
  const [etat, setEtat] = useState('TOUS')
  const [choisi, setChoisi] = useState(null)

  const produits = useMemo(() => (stock.data ?? []).filter((p) => p.type === type && p.actif), [stock.data, type])
  // Produit affiché dans la courbe : celui choisi, sinon le premier en alerte, sinon le premier
  const affiche = produits.find((p) => p.id_produit === choisi) ?? produits.find((p) => p.en_alerte) ?? produits[0]
  const valeurMP = (p) => (prix.data?.[p.id_produit] !== undefined ? p.quantite_stock * prix.data[p.id_produit] : 0)
  const valeurTotale = produits.reduce((t, p) => t + (mp ? valeurMP(p) : Number(p.valeur_stock ?? 0)), 0)
  const etats = mp ? ['A_COMMANDER', 'COMMANDE_EN_COURS', 'SUFFISANT'] : ['A_PRODUIRE', 'SUFFISANT']
  const filtres = produits.filter((p) => (etat === 'TOUS' || p.etat === etat) && correspond(recherche, p.code, p.designation))

  const boutonCourbe = (p) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setChoisi(p.id_produit)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
      aria-label={`Afficher la courbe de ${p.designation}`}
      aria-pressed={affiche?.id_produit === p.id_produit}
      className={cn(
        'inline-flex size-9 cursor-pointer items-center justify-center rounded-[10px] border transition-colors',
        affiche?.id_produit === p.id_produit ? 'border-ink bg-hl text-ink' : 'border-line bg-surf text-ink hover:bg-surf2',
      )}
    >
      <ChartColumn className="size-4" />
    </button>
  )

  const colonnes = [
    { id: 'designation', entete: mp ? 'Matière première' : 'Article', tri: (p) => p.designation, cellule: (p) => <CellulePrincipale titre={p.designation} sousTitre={`${p.code} · ${p.unite}`} /> },
    {
      id: 'stock',
      entete: 'Stock',
      align: 'right',
      tri: (p) => p.quantite_stock,
      cellule: (p) => <span className={cn('font-semibold', p.en_alerte && 'text-dfg')}>{formatNombre(p.quantite_stock)}</span>,
    },
    ...(mp
      ? [
          { id: 'pc', entete: 'Point de commande', align: 'right', tri: (p) => p.seuil, cellule: (p) => (p.seuil === null ? '—' : formatNombre(p.seuil)) },
          { id: 'q', entete: 'Q*', align: 'right', tri: (p) => p.quantite_economique, cellule: (p) => (p.quantite_economique ? formatNombre(p.quantite_economique) : '—') },
          { id: 'couverture', entete: 'Couverture', align: 'right', tri: (p) => p.couverture_jours, cellule: (p) => (p.couverture_jours === null ? '—' : `${formatNombre(p.couverture_jours, 0)} j`) },
        ]
      : [
          { id: 'seuil', entete: 'Seuil', align: 'right', tri: (p) => p.seuil, cellule: (p) => (p.seuil === null ? '—' : formatNombre(p.seuil)) },
          { id: 'prix', entete: 'Prix de vente', align: 'right', tri: (p) => Number(p.prix_vente), cellule: (p) => formatMontant(p.prix_vente) },
          { id: 'valeur', entete: 'Valeur', align: 'right', tri: (p) => Number(p.valeur_stock), cellule: (p) => formatMontantArrondi(p.valeur_stock) },
          { id: 'vendus', entete: 'Vendus 90 j', align: 'right', tri: (p) => p.ventes_90j, cellule: (p) => formatNombre(p.ventes_90j) },
          { id: 'produits', entete: 'Produits 90 j', align: 'right', tri: (p) => p.production_90j, cellule: (p) => formatNombre(p.production_90j) },
        ]),
    { id: 'etat', entete: 'État', tri: (p) => p.etat, cellule: (p) => <BadgeEtat etat={etatStock(p.etat)} /> },
    {
      id: 'actions',
      entete: mp ? 'Actions' : 'Courbe',
      align: 'right',
      cellule: (p) => (
        <div className="flex items-center justify-end gap-2">
          {mp && p.etat === 'A_COMMANDER' && (
            <Button size="sm" asChild>
              <Link to={`/gerant/commander?produit=${p.id_produit}`} onClick={(e) => e.stopPropagation()}>
                Commander
              </Link>
            </Button>
          )}
          {boutonCourbe(p)}
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageEntete
        titre={mp ? 'Stock des matières premières' : 'Stock des articles'}
        description="Consultation en temps réel. Le stock évolue uniquement par les mouvements enregistrés par le chef magasin."
      />
      <GrilleIndicateurs>
        <StatCard libelle={mp ? 'Matières premières' : 'Articles'} valeur={produits.length} sousTexte="produits actifs suivis" icone={mp ? Layers : Armchair} chargement={stock.isPending} />
        <StatCard
          libelle="En alerte"
          valeur={produits.filter((p) => p.en_alerte).length}
          sousTexte={mp ? 'stock au point de commande ou en dessous' : 'stock au seuil minimum ou en dessous'}
          icone={TriangleAlert}
          ton="danger"
          chargement={stock.isPending}
        />
        {mp ? (
          <StatCard libelle="Commandes en cours" valeur={produits.filter((p) => p.commande_en_cours).length} sousTexte="matières avec une commande en attente" icone={ClipboardList} ton="info" to="/gerant/commandes?etat=EN_ATTENTE" chargement={stock.isPending} />
        ) : (
          <StatCard libelle="À produire" valeur={produits.filter((p) => p.etat === 'A_PRODUIRE').length} sousTexte="articles à fabriquer" icone={TriangleAlert} ton="warn" chargement={stock.isPending} />
        )}
        <StatCard
          libelle="Valeur du stock"
          valeur={valeurTotale}
          formater={formatMontantArrondi}
          sousTexte={mp ? "au dernier prix d'achat connu" : 'au prix de vente'}
          icone={Wallet}
          ton="ok"
          chargement={stock.isPending || (mp && prix.isPending)}
        />
      </GrilleIndicateurs>

      {stock.isPending ? (
        <SqueletteBloc hauteur={280} />
      ) : (
        affiche && (
          <Carte key={affiche.id_produit}>
            <p className="-mb-2 text-[13px] text-mutedtxt">
              <strong className="text-[16px] text-ink">{affiche.designation}</strong> · {affiche.code} · choisissez un autre produit avec l'icône courbe du tableau
            </p>
            <EvolutionStock produit={affiche} />
          </Carte>
        )
      )}

      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
          <Recherche valeur={recherche} onChange={setRecherche} placeholder={mp ? 'Rechercher une matière…' : 'Rechercher un article…'} />
          <Onglets
            valeur={etat}
            onChange={setEtat}
            libelle="État"
            options={[
              { valeur: 'TOUS', libelle: mp ? 'Toutes' : 'Tous', compteur: produits.length },
              ...etats.map((e) => ({ valeur: e, libelle: etatStock(e).libelle, compteur: produits.filter((p) => p.etat === e).length })),
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
          onLigneClick={(p) => {
            setChoisi(p.id_produit)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          libelleElements={mp ? 'matière(s) affichée(s)' : 'article(s) affiché(s)'}
          vide={<EtatVide icone={mp ? Layers : Armchair} titre="Aucun produit" message="Aucun produit actif ne correspond à ces critères." />}
        />
        <Collapsible className="border-t border-line bg-surf2/60">
          <CollapsibleTrigger className="group flex w-full cursor-pointer items-center gap-2 px-[22px] py-3.5 text-left text-[14px] font-semibold text-ink">
            <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" aria-hidden="true" />
            Comment lire ce tableau
          </CollapsibleTrigger>
          <CollapsibleContent className="px-[22px] pb-4 text-[13px] leading-relaxed text-mutedtxt">
            {mp ? (
              <ul className="list-disc space-y-1 pl-5">
                <li><strong className="text-ink">Point de commande (PC)</strong> : niveau de stock auquel il faut commander, calculé à partir de la consommation, du délai de livraison et des jours de sécurité.</li>
                <li><strong className="text-ink">Q*</strong> : quantité économique de commande (formule de Wilson), point de départ de la négociation.</li>
                <li><strong className="text-ink">Couverture</strong> : nombre de jours de consommation que le stock actuel permet de tenir, au rythme des 90 derniers jours.</li>
                <li><strong className="text-ink">États</strong> : « À commander » quand le stock atteint le PC ; « Commande en cours » quand une commande est en attente de livraison.</li>
              </ul>
            ) : (
              <ul className="list-disc space-y-1 pl-5">
                <li><strong className="text-ink">Seuil</strong> : stock minimum fixé par le chef magasin ; en dessous, l'article passe « À produire ».</li>
                <li><strong className="text-ink">Valeur</strong> : stock × prix de vente.</li>
                <li><strong className="text-ink">Vendus / produits 90 j</strong> : quantités sorties par les ventes et entrées par la production atelier sur 90 jours.</li>
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Carte>
    </Page>
  )
}
