/*
 * C10 — Factures client (/chef/factures-client).
 * Indicateurs (nombre et total des factures, mois en cours), encart « Demandes à facturer »
 * (cartes cliquables), tableau : n° (FC-AAAA-NNNN), client, date, montant, actions (voir / imprimer).
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { FileText, Printer, Receipt, Wallet } from 'lucide-react'
import { useDemandes, useFacturesClient } from '@/hooks/useDonnees'
import {
  correspond,
  formatDate,
  formatMontant,
  formatMontantArrondi,
  formatMois,
  formatNombre,
  reference,
} from '@/lib/format'
import { CANAUX } from '@/api/ventes'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, GrilleIndicateurs } from '@/components/commun/Carte'
import { StatCard } from '@/components/commun/StatCard'
import { CellulePrincipale, DataTable, Reference } from '@/components/commun/DataTable'
import { EtatErreur, EtatVide } from '@/components/commun/Etats'
import { Recherche } from '@/components/commun/Recherche'
import { ActionIcone } from '@/components/commun/ActionIcone'
import { elementCascade, listeCascade } from '@/components/commun/animations'

export default function FacturesClient() {
  const factures = useFacturesClient()
  const demandes = useDemandes()
  const [recherche, setRecherche] = useState('')
  // Date de référence du mois en cours, fixée à l'ouverture de l'écran
  const [maintenant] = useState(() => new Date())
  const liste = useMemo(() => factures.data ?? [], [factures.data])
  const aFacturer = (demandes.data ?? []).filter((d) => d.etat === 'EN_ATTENTE')

  const stats = useMemo(() => {
    const debutMois = new Date(maintenant)
    debutMois.setDate(1)
    const iso = debutMois.toISOString().slice(0, 10)
    const duMois = liste.filter((f) => f.date_facture >= iso)
    return {
      total: liste.reduce((t, f) => t + Number(f.montant_total), 0),
      nbMois: duMois.length,
      totalMois: duMois.reduce((t, f) => t + Number(f.montant_total), 0),
    }
  }, [liste, maintenant])

  const filtrees = liste.filter((f) =>
    correspond(recherche, f.numero, f.demande_client?.client?.nom, reference('DEM', f.id_demande)),
  )
  const colonnes = [
    {
      id: 'numero',
      entete: 'Facture',
      tri: (f) => f.numero,
      cellule: (f) => <Reference>{f.numero}</Reference>,
    },
    {
      id: 'client',
      entete: 'Client',
      tri: (f) => f.demande_client?.client?.nom,
      cellule: (f) => (
        <CellulePrincipale
          titre={f.demande_client?.client?.nom}
          sousTitre={`${reference('DEM', f.id_demande)} · ${f.demande_client?.ligne_demande?.length ?? 0} article(s) · ${CANAUX[f.demande_client?.canal] ?? ''}`}
        />
      ),
    },
    {
      id: 'date',
      entete: 'Date',
      tri: (f) => f.date_facture,
      cellule: (f) => formatDate(f.date_facture),
    },
    {
      id: 'montant',
      entete: 'Montant',
      align: 'right',
      tri: (f) => Number(f.montant_total),
      cellule: (f) => <strong>{formatMontant(f.montant_total)}</strong>,
    },
    {
      id: 'actions',
      entete: 'Actions',
      align: 'right',
      cellule: (f) => (
        <ActionIcone
          libelle="Voir et imprimer"
          icone={Printer}
          to={`/chef/factures-client/${f.id_facture_c}/imprimer`}
        />
      ),
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Factures client"
        description="Factures établies à partir des demandes. Paiement comptant : chaque facture est réputée payée."
      />
      <GrilleIndicateurs>
        <StatCard
          libelle="Factures établies"
          valeur={liste.length}
          sousTexte="depuis le début"
          icone={Receipt}
          chargement={factures.isPending}
        />
        <StatCard
          libelle="Total facturé"
          valeur={stats.total}
          formater={formatMontantArrondi}
          sousTexte="toutes factures"
          icone={Wallet}
          ton="ok"
          chargement={factures.isPending}
        />
        <StatCard
          libelle={`Factures de ${formatMois(maintenant)}`}
          valeur={stats.nbMois}
          sousTexte={`${formatMontantArrondi(stats.totalMois)} facturés ce mois`}
          icone={Receipt}
          ton="info"
          chargement={factures.isPending}
        />
        <StatCard
          libelle="Demandes à facturer"
          valeur={aFacturer.length}
          sousTexte="en attente"
          icone={FileText}
          ton="warn"
          to="/chef/demandes?etat=EN_ATTENTE"
          chargement={demandes.isPending}
        />
      </GrilleIndicateurs>

      <Carte>
        <CarteEntete
          titre="Demandes à facturer"
          description="Cliquez sur une demande pour vérifier le stock et établir sa facture."
        />
        {demandes.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[100px] rounded-xl" />
            ))}
          </div>
        ) : demandes.isError ? (
          <EtatErreur erreur={demandes.error} onReessayer={demandes.refetch} />
        ) : aFacturer.length === 0 ? (
          <EtatVide
            icone={FileText}
            titre="Aucune demande en attente"
            message="Les nouvelles demandes des clients apparaîtront ici."
            compact
          />
        ) : (
          <motion.div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" {...listeCascade}>
            {aFacturer.map((d) => (
              <motion.div key={d.id_demande} variants={elementCascade.variants}>
                <Link
                  to={`/chef/factures-client/nouvelle?demande=${d.id_demande}`}
                  className="border-line bg-surf2 hover:border-line2 hover:shadow-hover block rounded-xl border px-4 py-3.5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-ink font-mono text-[14px] font-semibold">
                      {reference('DEM', d.id_demande)}
                    </span>
                    <span className="text-mutedtxt text-[12px]">{formatDate(d.date_demande)}</span>
                  </div>
                  <p className="text-ink mt-1.5 truncate text-[15px] font-semibold">
                    {d.client?.nom}
                  </p>
                  <p className="text-mutedtxt tabular text-[13px]">
                    {formatNombre(d.nb_articles)} article(s) ·{' '}
                    <strong className="text-ink">{formatMontant(d.montant)}</strong>
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Carte>

      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
          <CarteEntete titre="Factures" />
          <Recherche
            valeur={recherche}
            onChange={setRecherche}
            placeholder="FC-…, client, demande"
            className="sm:w-[300px]"
          />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={filtrees}
          cle={(f) => f.id_facture_c}
          chargement={factures.isPending}
          erreur={factures.error}
          onReessayer={factures.refetch}
          libelleElements="facture(s)"
          vide={
            <EtatVide
              icone={Receipt}
              titre={liste.length ? 'Aucune facture ne correspond' : 'Aucune facture établie'}
              message={
                liste.length
                  ? 'Modifiez la recherche.'
                  : 'Établissez la facture d’une demande en attente.'
              }
              action={
                !liste.length && (
                  <Button variant="outline" asChild>
                    <Link to="/chef/demandes?etat=EN_ATTENTE">Voir les demandes en attente</Link>
                  </Button>
                )
              }
              compact
            />
          }
        />
      </Carte>
    </Page>
  )
}
