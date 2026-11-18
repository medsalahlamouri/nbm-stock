/*
 * C1 — Tableau de bord du chef magasin (/chef), rafraîchi toutes les minutes.
 * Indicateurs : demandes à facturer, livraisons attendues, articles à produire, mouvements du jour.
 * Actions rapides, demandes en attente (Facturer), livraisons attendues (Réceptionner),
 * alertes de stock et derniers mouvements.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  Armchair,
  ArrowLeftRight,
  ClipboardCheck,
  FileText,
  Inbox,
  Layers,
  PackageCheck,
  Truck,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCommandes, useDemandes, useEtatStock, periodique } from '@/hooks/useDonnees'
import { supabase } from '@/lib/supabase'
import { deballer } from '@/lib/erreurs'
import { derniersMouvements } from '@/api/mouvements'
import {
  formatDate,
  formatHeure,
  formatMontant,
  formatMontantArrondi,
  formatNombre,
  reference,
} from '@/lib/format'
import { etatStock } from '@/lib/etats'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, GrilleBlocs, GrilleIndicateurs } from '@/components/commun/Carte'
import { Pastille, StatCard } from '@/components/commun/StatCard'
import { Badge } from '@/components/commun/Badge'
import { CellulePrincipale, DataTable, Reference } from '@/components/commun/DataTable'
import { EtatVide, SqueletteBloc } from '@/components/commun/Etats'
import { elementCascade, listeCascade } from '@/components/commun/animations'

const ACTIONS = [
  {
    to: '/chef/mouvements/nouveau',
    titre: 'Nouveau mouvement',
    detail: 'Matière première ou article',
    icone: ArrowLeftRight,
  },
  {
    to: '/chef/demandes/nouvelle',
    titre: 'Nouvelle demande',
    detail: 'Téléphone, fax ou sur place',
    icone: FileText,
  },
  {
    to: '/chef/factures-fournisseur/nouvelle',
    titre: 'Saisir une facture',
    detail: 'Réception fournisseur',
    icone: Inbox,
  },
  {
    to: '/chef/inventaire',
    titre: 'Faire un inventaire',
    detail: 'Comptage physique',
    icone: ClipboardCheck,
  },
]

async function mouvementsDuJour(debut) {
  const { count, error } = await supabase
    .from('mouvement_stock')
    .select('id_mouvement', { count: 'exact', head: true })
    .in('motif', ['Consommation atelier', 'Production atelier'])
    .gte('date_mouvement', debut)
  deballer({ data: null, error })
  return count ?? 0
}

function Lien({ to, children }) {
  return (
    <Link to={to} className="text-[14px] font-medium underline underline-offset-4 hover:opacity-75">
      {children}
    </Link>
  )
}

export default function TableauDeBordChef() {
  const { utilisateur } = useAuth()
  const naviguer = useNavigate()
  const [aujourdHui] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  })
  const demandes = useDemandes(periodique)
  const commandes = useCommandes(periodique)
  const stock = useEtatStock(periodique)
  const duJour = useQuery({
    queryKey: ['tableau-de-bord', 'mouvements-jour', aujourdHui],
    queryFn: () => mouvementsDuJour(aujourdHui),
    ...periodique,
  })
  const derniers = useQuery({
    queryKey: ['mouvements', 'derniers'],
    queryFn: () => derniersMouvements(6),
    ...periodique,
  })

  const aFacturer = (demandes.data ?? []).filter((d) => d.etat === 'EN_ATTENTE')
  const livraisons = (commandes.data ?? [])
    .filter((c) => c.etat === 'EN_ATTENTE')
    .sort((a, b) => a.jours_restants - b.jours_restants)
  const alertes = (stock.data ?? []).filter((p) => p.actif && p.en_alerte)
  const aProduire = alertes.filter((p) => p.etat === 'A_PRODUIRE')

  const colonnesDemandes = [
    {
      id: 'ref',
      entete: 'Demande',
      cellule: (d) => (
        <CellulePrincipale
          titre={<Reference>{reference('DEM', d.id_demande)}</Reference>}
          sousTitre={formatDate(d.date_demande)}
        />
      ),
    },
    { id: 'client', entete: 'Client', cellule: (d) => d.client?.nom },
    { id: 'montant', entete: 'Montant', align: 'right', cellule: (d) => formatMontant(d.montant) },
    {
      id: 'action',
      entete: '',
      align: 'right',
      cellule: (d) => (
        <Button size="sm" asChild>
          <Link
            to={`/chef/factures-client/nouvelle?demande=${d.id_demande}`}
            onClick={(e) => e.stopPropagation()}
          >
            Facturer
          </Link>
        </Button>
      ),
    },
  ]
  const colonnesLivraisons = [
    {
      id: 'ref',
      entete: 'Commande',
      cellule: (c) => (
        <CellulePrincipale
          titre={<Reference>{reference('CMD', c.id_commande)}</Reference>}
          sousTitre={c.devis?.fournisseur?.raison_sociale}
        />
      ),
    },
    { id: 'mp', entete: 'Matière première', cellule: (c) => c.devis?.produit?.designation },
    {
      id: 'etat',
      entete: 'État',
      cellule: (c) =>
        c.jours_restants < 0 ? (
          <Badge ton="danger">Retard {Math.abs(c.jours_restants)} j</Badge>
        ) : c.jours_restants === 0 ? (
          <Badge ton="warn">Aujourd'hui</Badge>
        ) : (
          <Badge ton="info">Dans {c.jours_restants} j</Badge>
        ),
    },
    {
      id: 'action',
      entete: '',
      align: 'right',
      cellule: (c) => (
        <Button size="sm" variant="outline" asChild>
          <Link
            to={`/chef/factures-fournisseur/nouvelle?commande=${c.id_commande}`}
            onClick={(e) => e.stopPropagation()}
          >
            Réceptionner
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <Page>
      <PageEntete
        titre={`Bonjour ${utilisateur?.prenom ?? ''}`}
        description="Vos tâches du jour : demandes à facturer, livraisons attendues et articles à produire."
      />

      <GrilleIndicateurs>
        <StatCard
          libelle="Demandes à facturer"
          valeur={aFacturer.length}
          sousTexte={`${formatMontantArrondi(aFacturer.reduce((t, d) => t + d.montant, 0))} en attente`}
          icone={FileText}
          ton="warn"
          to="/chef/demandes?etat=EN_ATTENTE"
          chargement={demandes.isPending}
        />
        <StatCard
          libelle="Livraisons attendues"
          valeur={livraisons.length}
          sousTexte={`${formatNombre(livraisons.filter((c) => c.jours_restants < 0).length)} en retard`}
          icone={Truck}
          ton="danger"
          to="/chef/factures-fournisseur"
          chargement={commandes.isPending}
        />
        <StatCard
          libelle="Articles à produire"
          valeur={aProduire.length}
          sousTexte="stock au seuil minimum"
          icone={Armchair}
          ton="warn"
          to="/chef/produits?type=ARTICLE"
          chargement={stock.isPending}
        />
        <StatCard
          libelle="Mouvements du jour"
          valeur={duJour.data ?? 0}
          sousTexte="consommations et production"
          icone={ArrowLeftRight}
          to="/chef/mouvements"
          chargement={duJour.isPending}
        />
      </GrilleIndicateurs>

      <motion.div
        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
        {...listeCascade}
      >
        {ACTIONS.map((a) => (
          <motion.div key={a.to} variants={elementCascade.variants}>
            <Link
              to={a.to}
              className="border-line bg-surf shadow-card hover:border-line2 hover:shadow-hover flex h-full items-center gap-4 rounded-[14px] border px-5 py-4 transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-px"
            >
              <span className="bg-strong text-bg inline-flex size-12 shrink-0 items-center justify-center rounded-xl">
                <a.icone className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="text-ink block text-[15px] font-semibold">{a.titre}</span>
                <span className="text-mutedtxt block text-[13px]">{a.detail}</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="p-[22px] pb-4">
          <CarteEntete
            titre="Demandes en attente"
            description="Le stock est vérifié au moment de la facture"
            action={<Lien to="/chef/demandes?etat=EN_ATTENTE">Toutes</Lien>}
          />
        </div>
        <DataTable
          colonnes={colonnesDemandes}
          lignes={aFacturer}
          cle={(d) => d.id_demande}
          chargement={demandes.isPending}
          erreur={demandes.error}
          onReessayer={demandes.refetch}
          onLigneClick={(d) => naviguer(`/chef/demandes/${d.id_demande}/modifier`)}
          libelleElements="demande(s) en attente"
          taillePage={5}
          vide={
            <EtatVide
              icone={FileText}
              titre="Aucune demande en attente"
              message="Les nouvelles demandes des clients apparaîtront ici."
              compact
            />
          }
        />
      </Carte>

      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="p-[22px] pb-4">
          <CarteEntete
            titre="Livraisons attendues"
            description="Commandes passées par le gérant"
            action={<Lien to="/chef/factures-fournisseur">Factures fournisseur</Lien>}
          />
        </div>
        <DataTable
          colonnes={colonnesLivraisons}
          lignes={livraisons}
          cle={(c) => c.id_commande}
          chargement={commandes.isPending}
          erreur={commandes.error}
          onReessayer={commandes.refetch}
          onLigneClick={(c) =>
            naviguer(`/chef/factures-fournisseur/nouvelle?commande=${c.id_commande}`)
          }
          libelleElements="livraison(s) attendue(s)"
          taillePage={5}
          vide={
            <EtatVide
              icone={PackageCheck}
              titre="Aucune livraison attendue"
              message="Toutes les commandes ont été réceptionnées."
              compact
            />
          }
        />
      </Carte>

      <GrilleBlocs>
        <Carte>
          <CarteEntete
            titre="Alertes de stock"
            description="Produits au point de commande ou au seuil minimum"
            action={<Lien to="/chef/produits">Produits</Lien>}
          />
          {stock.isPending ? (
            <SqueletteBloc hauteur={160} className="border-0 p-0" />
          ) : alertes.length === 0 ? (
            <EtatVide
              icone={PackageCheck}
              titre="Aucune alerte"
              message="Tous les produits sont au-dessus de leur seuil."
              compact
            />
          ) : (
            <motion.ul className="flex flex-col" {...listeCascade}>
              {alertes.slice(0, 6).map((p) => {
                const etat = etatStock(p.etat)
                return (
                  <motion.li key={p.id_produit} variants={elementCascade.variants}>
                    <Link
                      to={`/chef/produits/${p.id_produit}`}
                      className="border-line3 hover:bg-surf2 flex items-center gap-3 rounded-lg border-b py-3 last:border-0"
                    >
                      <Pastille
                        icone={p.type === 'MP' ? Layers : Armchair}
                        ton={etat.ton}
                        taille={40}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-ink block truncate text-[14px] font-semibold">
                          {p.designation}
                        </span>
                        <span className="text-mutedtxt block text-[13px]">
                          Stock {formatNombre(p.quantite_stock)} ·{' '}
                          {p.type === 'MP' ? 'PC' : 'seuil'} {formatNombre(p.seuil)}
                        </span>
                      </span>
                      <Badge ton={etat.ton}>{etat.libelle}</Badge>
                    </Link>
                  </motion.li>
                )
              })}
            </motion.ul>
          )}
        </Carte>
        <Carte>
          <CarteEntete
            titre="Derniers mouvements"
            description="Tous produits confondus"
            action={<Lien to="/chef/mouvements">Tout le journal</Lien>}
          />
          {derniers.isPending ? (
            <SqueletteBloc hauteur={160} className="border-0 p-0" />
          ) : (derniers.data ?? []).length === 0 ? (
            <EtatVide icone={ArrowLeftRight} titre="Aucun mouvement" compact />
          ) : (
            <motion.ul className="flex flex-col" {...listeCascade}>
              {derniers.data.map((m) => (
                <motion.li
                  key={m.id_mouvement}
                  variants={elementCascade.variants}
                  className="border-line3 flex items-center gap-3 border-b py-2.5 last:border-0"
                >
                  <span className="text-mutedtxt tabular w-[86px] shrink-0 text-[12px]">
                    {formatDate(m.date_mouvement).slice(0, 5)} · {formatHeure(m.date_mouvement)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-ink block truncate text-[14px] font-medium">
                      {m.produit?.designation}
                    </span>
                    <span className="text-mutedtxt block text-[12px]">{m.motif}</span>
                  </span>
                  <span
                    className={cn(
                      'tabular text-[14px] font-semibold',
                      m.type === 'ENTREE' ? 'text-okfg' : 'text-dfg',
                    )}
                  >
                    {m.type === 'ENTREE' ? '+' : '−'}
                    {formatNombre(m.quantite)}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </Carte>
      </GrilleBlocs>
    </Page>
  )
}
