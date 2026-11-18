/*
 * C3 — Fiche produit (/chef/produits/:id).
 * Indicateurs (MP : PC, Q*, délai L, dernier prix d'achat ; article : seuil, prix de vente, valeur,
 * vendus sur 90 j), courbe d'évolution du stock, bilan par motif (anneau),
 * journal des mouvements avec colonne « stock après ».
 */
import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  Calculator,
  Pencil,
  Receipt,
  Tag,
  Timer,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { lireProduit } from '@/api/stock'
import { useEtatStock, usePrixAchat } from '@/hooks/useDonnees'
import {
  formatDate,
  formatDateHeure,
  formatMontant,
  formatMontantArrondi,
  formatNombre,
} from '@/lib/format'
import { etatStock } from '@/lib/etats'
import { MOTIFS } from '@/api/mouvements'
import { cn } from '@/lib/utils'
import { useFilAriane } from '@/components/layout/FilAriane'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, GrilleIndicateurs } from '@/components/commun/Carte'
import { StatCard } from '@/components/commun/StatCard'
import { Badge, BadgeEtat } from '@/components/commun/Badge'
import { DataTable } from '@/components/commun/DataTable'
import { EtatErreur, EtatVide, SqueletteBloc } from '@/components/commun/Etats'
import { Anneau } from '@/components/commun/Graphiques'
import { EvolutionStock, useHistoriqueProduit } from '@/components/commun/EvolutionStock'

const COULEURS_MOTIFS = {
  'Consommation atelier': 'var(--red)',
  'Réception fournisseur': 'var(--strong)',
  'Stock initial': 'var(--gold)',
  'Production atelier': 'var(--green)',
  Vente: 'var(--gold2)',
  Inventaire: 'var(--blue)',
}

function JournalMouvements({ produit }) {
  const historique = useHistoriqueProduit(produit)
  const colonnes = [
    {
      id: 'date',
      entete: 'Date',
      cellule: (m) => (
        <span className="tabular">{formatDateHeure(m.date_mouvement).replace(' à ', ' · ')}</span>
      ),
    },
    {
      id: 'motif',
      entete: 'Motif',
      cellule: (m) => (
        <span className="inline-flex items-center gap-2">
          {m.motif}
          {MOTIFS[m.motif]?.auto && <Badge ton="info">Auto</Badge>}
        </span>
      ),
    },
    {
      id: 'qte',
      entete: 'Quantité',
      align: 'right',
      cellule: (m) => (
        <span className={cn('font-semibold', m.type === 'ENTREE' ? 'text-okfg' : 'text-dfg')}>
          {m.type === 'ENTREE' ? '+' : '−'}
          {formatNombre(m.quantite)}
        </span>
      ),
    },
    {
      id: 'apres',
      entete: 'Stock après',
      align: 'right',
      cellule: (m) => formatNombre(m.stock_apres),
    },
    {
      id: 'par',
      entete: 'Par',
      cellule: (m) => (
        <span className="text-ink3">
          {m.utilisateur ? `${m.utilisateur.prenom} ${m.utilisateur.nom}` : '—'}
        </span>
      ),
    },
  ]
  return (
    <DataTable
      colonnes={colonnes}
      lignes={historique.data}
      cle={(m) => m.id_mouvement}
      chargement={historique.isPending}
      erreur={historique.error}
      onReessayer={historique.refetch}
      libelleElements="mouvement(s)"
      vide={
        <EtatVide
          icone={ArrowLeftRight}
          titre="Aucun mouvement"
          message="Ce produit n'a encore aucun mouvement enregistré."
          compact
        />
      }
    />
  )
}

function BilanMotifs({ produit }) {
  const historique = useHistoriqueProduit(produit)
  const donnees = useMemo(() => {
    const totaux = {}
    for (const m of historique.data ?? []) totaux[m.motif] = (totaux[m.motif] ?? 0) + m.quantite
    return Object.entries(totaux)
      .sort((a, b) => b[1] - a[1])
      .map(([motif, valeur]) => ({ libelle: motif, valeur, couleur: COULEURS_MOTIFS[motif] }))
  }, [historique.data])
  const premier = historique.data?.at(-1)?.date_mouvement
  return (
    <Carte>
      <CarteEntete
        titre="Bilan par motif"
        description={premier ? `Quantités depuis le ${formatDate(premier)}` : 'Aucun mouvement'}
      />
      {historique.isPending ? (
        <SqueletteBloc hauteur={160} className="border-0 p-0" />
      ) : (
        <Anneau donnees={donnees} libelleTotal={produit.unite} className="sm:flex-col" />
      )}
    </Carte>
  )
}

export default function ProduitFiche() {
  const { id } = useParams()
  const idP = Number(id)
  const produit = useQuery({ queryKey: ['produit', idP], queryFn: () => lireProduit(idP) })
  const stock = useEtatStock()
  const prix = usePrixAchat()
  useFilAriane(produit.data?.designation)

  if (produit.isPending)
    return (
      <Page>
        <SqueletteBloc hauteur={110} />
        <SqueletteBloc hauteur={300} />
      </Page>
    )
  if (produit.isError)
    return (
      <Carte>
        <EtatErreur erreur={produit.error} onReessayer={produit.refetch} />
      </Carte>
    )

  const p = produit.data
  const etat = (stock.data ?? []).find((e) => e.id_produit === idP)
  const mp = p.type === 'MP'
  const dernierPrix = prix.data?.[idP]

  return (
    <Page>
      <PageEntete
        titre={p.designation}
        description={`${p.code} · ${mp ? 'matière première' : 'article'} · unité : ${p.unite}`}
        badges={
          p.actif ? etat && <BadgeEtat etat={etatStock(etat.etat)} /> : <Badge>Inactif</Badge>
        }
        actions={
          <Button variant="outline" asChild>
            <Link to={`/chef/produits/${idP}/modifier`}>
              <Pencil /> Modifier
            </Link>
          </Button>
        }
      />

      <GrilleIndicateurs>
        {mp ? (
          <>
            <StatCard
              libelle="Point de commande"
              valeur={p.point_commande ?? '—'}
              sousTexte={
                p.point_commande !== null
                  ? "commander quand le stock l'atteint"
                  : 'paramètres à régler par le gérant'
              }
              icone={TriangleAlert}
              ton="danger"
            />
            <StatCard
              libelle="Quantité économique Q*"
              valeur={p.quantite_economique ?? '—'}
              sousTexte="quantité conseillée par commande"
              icone={Calculator}
            />
            <StatCard
              libelle="Délai de livraison L"
              valeur={p.delai_livraison !== null ? `${formatNombre(p.delai_livraison)} jours` : '—'}
              sousTexte={
                p.jours_securite !== null
                  ? `+ ${formatNombre(p.jours_securite)} jours de sécurité`
                  : 'non renseigné'
              }
              icone={Timer}
            />
            <StatCard
              libelle="Dernier prix d'achat"
              valeur={dernierPrix !== undefined ? formatMontant(dernierPrix) : '—'}
              sousTexte={dernierPrix !== undefined ? `par ${p.unite}` : 'aucun devis ni facture'}
              icone={Receipt}
              chargement={prix.isPending}
            />
          </>
        ) : (
          <>
            <StatCard
              libelle="Seuil minimum"
              valeur={p.seuil_minimum ?? '—'}
              sousTexte="produire quand le stock l'atteint"
              icone={TriangleAlert}
              ton="warn"
            />
            <StatCard
              libelle="Prix de vente"
              valeur={formatMontant(p.prix_vente)}
              sousTexte={`par ${p.unite}`}
              icone={Tag}
            />
            <StatCard
              libelle="Valeur du stock"
              valeur={Number(p.quantite_stock) * Number(p.prix_vente ?? 0)}
              formater={formatMontantArrondi}
              sousTexte="au prix de vente"
              icone={Wallet}
              ton="ok"
            />
            <StatCard
              libelle="Vendus sur 90 jours"
              valeur={etat?.ventes_90j ?? 0}
              sousTexte={`${formatNombre(etat?.production_90j ?? 0)} produits sur la même période`}
              icone={ArrowLeftRight}
              chargement={stock.isPending}
            />
          </>
        )}
      </GrilleIndicateurs>

      <Carte>
        <EvolutionStock produit={p} />
      </Carte>

      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(300px,1fr)_2fr]">
        <BilanMotifs produit={p} />
        <Carte sansPadding className="gap-0 overflow-hidden">
          <div className="p-[22px] pb-4">
            <CarteEntete
              titre="Journal des mouvements"
              description="Du plus récent au plus ancien, avec le stock après chaque mouvement"
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/chef/mouvements?type=${p.type}&produit=${idP}`}>Tout le journal</Link>
                </Button>
              }
            />
          </div>
          <JournalMouvements produit={p} />
        </Carte>
      </div>
    </Page>
  )
}
