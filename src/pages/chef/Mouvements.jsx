/*
 * C4 — Mouvements (/chef/mouvements).
 * Onglets Matières premières / Articles ; résumé sur 30 jours (entrées, sorties, par motif).
 * Filtres : produit (combobox) + motif (onglets) + période. Tableau paginé côté serveur :
 * date et heure, produit, type (↑/↓), quantité, motif, utilisateur, badge « Auto » (réception, vente).
 */
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Armchair, Layers, Plus } from 'lucide-react'
import { MOTIFS, MOTIFS_PAR_TYPE, listerMouvements, resumerMouvements } from '@/api/mouvements'
import { useEtatStock } from '@/hooks/useDonnees'
import { formatDate, formatHeure, formatNombre } from '@/lib/format'
import { debutPeriode } from '@/lib/periodes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, GrilleIndicateurs } from '@/components/commun/Carte'
import { StatCard } from '@/components/commun/StatCard'
import { Badge } from '@/components/commun/Badge'
import { CellulePrincipale, DataTable } from '@/components/commun/DataTable'
import { EtatVide } from '@/components/commun/Etats'
import { Onglets } from '@/components/commun/Onglets'
import { Combobox } from '@/components/commun/Combobox'

const PERIODES = [
  { valeur: 7, libelle: '7 j' },
  { valeur: 30, libelle: '30 j' },
  { valeur: 90, libelle: '90 j' },
  { valeur: 0, libelle: 'Tout' },
]

export default function Mouvements() {
  const [parametres, setParametres] = useSearchParams()
  const type = parametres.get('type') === 'ARTICLE' ? 'ARTICLE' : 'MP'
  const idProduit = parametres.get('produit') ? Number(parametres.get('produit')) : null
  const [motif, setMotif] = useState('tous')
  const [periode, setPeriode] = useState(30)
  const [page, setPage] = useState(1)
  const stock = useEtatStock()

  const filtres = {
    type,
    idProduit,
    motif: motif === 'tous' ? null : motif,
    depuis: debutPeriode(periode),
  }
  const mouvements = useQuery({
    queryKey: ['mouvements', 'liste', type, idProduit, motif, periode, page],
    queryFn: () => listerMouvements({ ...filtres, page }),
    placeholderData: (precedent) => precedent,
  })
  const resume = useQuery({
    queryKey: ['mouvements', 'resume', type],
    queryFn: () => resumerMouvements({ type, depuis: debutPeriode(30) }),
  })

  const changer = (cle, valeur) => {
    setPage(1)
    setParametres(
      (p) => {
        if (valeur === null || valeur === undefined) p.delete(cle)
        else p.set(cle, String(valeur))
        if (cle === 'type') p.delete('produit')
        return p
      },
      { replace: true },
    )
  }

  const options = (stock.data ?? [])
    .filter((p) => p.type === type)
    .map((p) => ({ valeur: p.id_produit, libelle: p.designation, sousLibelle: p.code }))
  const motifs = MOTIFS_PAR_TYPE[type]
  const r = resume.data
  const principal = type === 'MP' ? 'Consommation atelier' : 'Production atelier'

  const colonnes = [
    {
      id: 'date',
      entete: 'Date et heure',
      cellule: (m) => (
        <div className="tabular">
          <div>{formatDate(m.date_mouvement)}</div>
          <div className="text-mutedtxt text-[12px]">{formatHeure(m.date_mouvement)}</div>
        </div>
      ),
    },
    {
      id: 'produit',
      entete: 'Produit',
      cellule: (m) => (
        <Link
          to={`/chef/produits/${m.produit.id_produit}`}
          onClick={(e) => e.stopPropagation()}
          className="block hover:underline"
        >
          <CellulePrincipale titre={m.produit.designation} sousTitre={m.produit.code} />
        </Link>
      ),
    },
    {
      id: 'type',
      entete: 'Type',
      cellule: (m) =>
        m.type === 'ENTREE' ? (
          <span className="text-okfg inline-flex items-center gap-1 text-[13px] font-medium">
            <ArrowDownLeft className="size-4" aria-hidden="true" /> Entrée
          </span>
        ) : (
          <span className="text-dfg inline-flex items-center gap-1 text-[13px] font-medium">
            <ArrowUpRight className="size-4" aria-hidden="true" /> Sortie
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
          {formatNombre(m.quantite)}{' '}
          <span className="text-mutedtxt font-normal">{m.produit.unite}</span>
        </span>
      ),
    },
    {
      id: 'motif',
      entete: 'Motif',
      cellule: (m) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <Badge ton={m.motif === 'Inventaire' ? 'warn' : 'neutral'}>{m.motif}</Badge>
          {MOTIFS[m.motif]?.auto && <Badge ton="info">Auto</Badge>}
        </span>
      ),
    },
    {
      id: 'par',
      entete: 'Utilisateur',
      cellule: (m) => (
        <span className="text-ink3">
          {m.utilisateur ? `${m.utilisateur.prenom} ${m.utilisateur.nom}` : '—'}
        </span>
      ),
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Mouvements"
        description="Entrées et sorties de stock. Les réceptions et les ventes (« Auto ») sont créées par les factures ; un mouvement n'est jamais modifié."
        actions={
          <Button asChild>
            <Link to={`/chef/mouvements/nouveau?type=${type}`}>
              <Plus /> Nouveau mouvement
            </Link>
          </Button>
        }
      />
      <Onglets
        valeur={type}
        onChange={(v) => {
          setMotif('tous')
          changer('type', v)
        }}
        libelle="Type de produit"
        options={[
          { valeur: 'MP', libelle: 'Matières premières', icone: Layers },
          { valeur: 'ARTICLE', libelle: 'Articles', icone: Armchair },
        ]}
        className="self-start"
      />

      <GrilleIndicateurs>
        <StatCard
          libelle="Mouvements sur 30 jours"
          valeur={r?.nombre ?? 0}
          sousTexte={`${formatNombre(r?.nbEntrees ?? 0)} entrées, ${formatNombre(r?.nbSorties ?? 0)} sorties`}
          icone={ArrowLeftRight}
          chargement={resume.isPending}
        />
        <StatCard
          libelle="Quantités entrées"
          valeur={r?.entrees ?? 0}
          sousTexte="unités entrées en stock"
          icone={ArrowDownLeft}
          ton="ok"
          chargement={resume.isPending}
        />
        <StatCard
          libelle="Quantités sorties"
          valeur={r?.sorties ?? 0}
          sousTexte="unités sorties du stock"
          icone={ArrowUpRight}
          ton="danger"
          chargement={resume.isPending}
        />
        <StatCard
          libelle={principal}
          valeur={(r?.parMotif[principal]?.entrees ?? 0) + (r?.parMotif[principal]?.sorties ?? 0)}
          sousTexte={`${formatNombre(r?.parMotif[principal]?.nombre ?? 0)} mouvement(s) saisi(s)`}
          icone={type === 'MP' ? Layers : Armchair}
          ton="warn"
          chargement={resume.isPending}
        />
      </GrilleIndicateurs>

      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-[22px] pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Combobox
              libelle="Filtrer par produit"
              valeur={idProduit}
              onChange={(v) => changer('produit', v)}
              options={options}
              placeholder="Tous les produits"
              recherchePlaceholder="Code ou désignation…"
              effacable
              className="w-full sm:w-[340px]"
            />
            <Onglets
              valeur={periode}
              onChange={(v) => {
                setPeriode(v)
                setPage(1)
              }}
              libelle="Période"
              taille="sm"
              options={PERIODES}
            />
          </div>
          <Onglets
            valeur={motif}
            onChange={(v) => {
              setMotif(v)
              setPage(1)
            }}
            libelle="Motif"
            taille="sm"
            options={[
              { valeur: 'tous', libelle: 'Tous les motifs' },
              ...motifs.map((m) => ({ valeur: m, libelle: m })),
            ]}
            className="self-start"
          />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={mouvements.data?.lignes}
          cle={(m) => m.id_mouvement}
          chargement={mouvements.isPending}
          erreur={mouvements.error}
          onReessayer={mouvements.refetch}
          serveur={{ total: mouvements.data?.total ?? 0, page, onPage: setPage }}
          libelleElements="mouvement(s)"
          vide={
            <EtatVide
              icone={ArrowLeftRight}
              titre="Aucun mouvement"
              message="Aucun mouvement ne correspond à ces filtres."
              action={
                <Button asChild>
                  <Link to={`/chef/mouvements/nouveau?type=${type}`}>
                    <Plus /> Nouveau mouvement
                  </Link>
                </Button>
              }
            />
          }
        />
      </Carte>
    </Page>
  )
}
