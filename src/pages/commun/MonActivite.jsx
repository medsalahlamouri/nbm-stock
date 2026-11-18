/*
 * A4 — Mon activité (/gerant/activite, /chef/activite).
 * Source : journal_activite filtré sur l'utilisateur connecté (et mouvement_stock pour la répartition
 * des mouvements du chef). Indicateurs, deux anneaux de répartition, journal paginé et filtrable.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileText,
  Inbox,
  Receipt,
  Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toutLire } from '@/lib/requetes'
import { formatDate, formatMois } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { LIBELLES_DOMAINES, domaineLigne, libelleAction, lireJournalPeriode } from '@/api/journal'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, GrilleBlocs, GrilleIndicateurs } from '@/components/commun/Carte'
import { StatCard } from '@/components/commun/StatCard'
import { Onglets } from '@/components/commun/Onglets'
import { Anneau } from '@/components/commun/Graphiques'
import { COULEURS } from '@/lib/etats'
import { EtatErreur, SqueletteBloc } from '@/components/commun/Etats'
import { JournalActivite } from '@/components/commun/Journal'
import { PERIODES, debutPeriode } from '@/lib/periodes'

const COULEURS_MOTIFS = {
  'Consommation atelier': 'var(--red)',
  Vente: 'var(--gold)',
  'Production atelier': 'var(--green)',
  'Stock initial': 'var(--sand)',
  'Réception fournisseur': 'var(--strong)',
  Inventaire: 'var(--blue)',
}
const COULEURS_DOMAINES = {
  stock: 'var(--strong)',
  ventes: 'var(--gold)',
  achats: 'var(--blue)',
  connexion: 'var(--sand)',
  comptes: 'var(--sand)',
  statistiques: 'var(--green)',
  autre: 'var(--muted2)',
}

/** Mouvements saisis par l'utilisateur (répartition par motif) */
async function mouvementsUtilisateur(id, depuis) {
  return toutLire(() => {
    let r = supabase
      .from('mouvement_stock')
      .select('id_mouvement, motif, date_mouvement')
      .eq('id_utilisateur', id)
    if (depuis) r = r.gte('date_mouvement', depuis)
    return r.order('id_mouvement')
  })
}

export default function MonActivite() {
  const { utilisateur } = useAuth()
  const gerant = utilisateur?.profil === 'GERANT'
  const [periode, setPeriode] = useState(90)
  const depuis = debutPeriode(periode)
  const libellePeriode = periode
    ? `depuis le ${formatDate(depuis)}`
    : 'depuis la création du compte'

  const journal = useQuery({
    queryKey: ['journal', 'moi', utilisateur?.id_utilisateur, periode],
    queryFn: () => lireJournalPeriode({ idUtilisateur: utilisateur.id_utilisateur, depuis }),
    enabled: Boolean(utilisateur),
  })
  const mouvements = useQuery({
    queryKey: ['mouvements', 'moi', utilisateur?.id_utilisateur, periode],
    queryFn: () => mouvementsUtilisateur(utilisateur.id_utilisateur, depuis),
    enabled: Boolean(utilisateur) && !gerant,
  })

  const stats = useMemo(() => {
    const lignes = journal.data ?? []
    const compter = (filtre) => lignes.filter(filtre).length
    const parDomaine = {}
    for (const l of lignes) {
      const d = domaineLigne(l, utilisateur?.profil)
      parDomaine[d] = (parDomaine[d] ?? 0) + 1
    }
    const inventaires = lignes
      .filter((l) => l.action === 'INVENTAIRE')
      .map((l) => formatDate(l.date_heure))
    const sauvegardes = lignes.filter((l) => l.action === 'SAUVEGARDE')
    const parMotif = {}
    for (const m of mouvements.data ?? []) parMotif[m.motif] = (parMotif[m.motif] ?? 0) + 1
    return {
      parDomaine,
      parMotif,
      factures: compter((l) => l.action === 'FACTURE_CLIENT'),
      facturesF: compter((l) => l.action === 'FACTURE_FOURNISSEUR'),
      inventaires,
      atelier: (mouvements.data ?? []).filter((m) =>
        ['Consommation atelier', 'Production atelier'].includes(m.motif),
      ).length,
      commandes: compter((l) => l.action === 'COMMANDE'),
      devis: compter((l) => l.objet === 'devis'),
      fournisseurs: compter((l) => l.objet === 'fournisseur'),
      comptes: compter(
        (l) =>
          ['CREATION_COMPTE', 'REINIT_MDP', 'MODIFICATION_EMAIL'].includes(l.action) ||
          (l.objet === 'utilisateur' && l.action !== 'CONNEXION' && l.action !== 'CHANGEMENT_MDP'),
      ),
      sauvegardes: sauvegardes.length,
      derniereSauvegarde: sauvegardes.sort((a, b) => b.date_heure.localeCompare(a.date_heure))[0]
        ?.date_heure,
      parAction: lignes.reduce((acc, l) => ({ ...acc, [l.action]: (acc[l.action] ?? 0) + 1 }), {}),
    }
  }, [journal.data, mouvements.data, utilisateur?.profil])

  const chargement = journal.isPending || (!gerant && mouvements.isPending)
  const domaines = gerant
    ? ['achats', 'comptes', 'statistiques']
    : ['stock', 'ventes', 'achats', 'connexion']

  const anneauDomaines = Object.entries(stats.parDomaine)
    .sort((a, b) => b[1] - a[1])
    .map(([d, valeur]) => ({
      libelle: LIBELLES_DOMAINES[d]?.libelle ?? d,
      valeur,
      couleur: COULEURS_DOMAINES[d],
    }))
  const anneauGauche = gerant
    ? Object.entries(stats.parAction)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([action, valeur], i) => ({
          libelle: libelleAction(action).libelle,
          valeur,
          couleur: COULEURS[i],
        }))
    : Object.entries(stats.parMotif)
        .sort((a, b) => b[1] - a[1])
        .map(([motif, valeur]) => ({ libelle: motif, valeur, couleur: COULEURS_MOTIFS[motif] }))

  return (
    <Page>
      <PageEntete
        titre="Mon activité"
        description="Historique de vos opérations, enregistré automatiquement et non modifiable."
        actions={
          <Onglets
            options={PERIODES}
            valeur={periode}
            onChange={setPeriode}
            libelle="Période"
            taille="sm"
          />
        }
      />

      <GrilleIndicateurs>
        {gerant ? (
          <>
            <StatCard
              libelle="Commandes passées"
              valeur={stats.commandes}
              sousTexte={libellePeriode}
              icone={ClipboardList}
              ton="neutral"
              chargement={chargement}
            />
            <StatCard
              libelle="Devis et fournisseurs"
              valeur={stats.devis + stats.fournisseurs}
              sousTexte={`${stats.devis} devis, ${stats.fournisseurs} fournisseur(s)`}
              icone={FileText}
              ton="info"
              chargement={chargement}
            />
            <StatCard
              libelle="Comptes administrés"
              valeur={stats.comptes}
              sousTexte="créations, réinitialisations, modifications"
              icone={Users}
              ton="warn"
              chargement={chargement}
            />
            <StatCard
              libelle="Sauvegardes"
              valeur={stats.sauvegardes}
              sousTexte={
                stats.derniereSauvegarde
                  ? `dernière le ${formatDate(stats.derniereSauvegarde)}`
                  : 'aucune sur la période'
              }
              icone={Database}
              ton="ok"
              chargement={chargement}
            />
          </>
        ) : (
          <>
            <StatCard
              libelle="Mouvements atelier"
              valeur={stats.atelier}
              sousTexte={libellePeriode}
              icone={ArrowLeftRight}
              ton="neutral"
              chargement={chargement}
            />
            <StatCard
              libelle="Factures client"
              valeur={stats.factures}
              sousTexte="établies"
              icone={Receipt}
              ton="ok"
              chargement={chargement}
            />
            <StatCard
              libelle="Factures fournisseur"
              valeur={stats.facturesF}
              sousTexte="saisies et contrôlées"
              icone={Inbox}
              ton="info"
              chargement={chargement}
            />
            <StatCard
              libelle="Inventaires"
              valeur={stats.inventaires.length}
              sousTexte={
                stats.inventaires.length
                  ? stats.inventaires.slice(0, 3).join(' et ')
                  : 'aucun sur la période'
              }
              icone={ClipboardCheck}
              ton="warn"
              chargement={chargement}
            />
          </>
        )}
      </GrilleIndicateurs>

      {journal.isError ? (
        <Carte>
          <EtatErreur erreur={journal.error} onReessayer={journal.refetch} />
        </Carte>
      ) : chargement ? (
        <GrilleBlocs>
          <SqueletteBloc hauteur={180} />
          <SqueletteBloc hauteur={180} />
        </GrilleBlocs>
      ) : (
        <GrilleBlocs>
          <Carte>
            <CarteEntete
              titre={gerant ? 'Opérations par type' : 'Mouvements par motif'}
              description={
                gerant
                  ? `Entrées du journal ${libellePeriode}`
                  : `Nombre de mouvements ${libellePeriode}`
              }
            />
            <Anneau donnees={anneauGauche} libelleTotal={gerant ? 'opérations' : 'mouvements'} />
          </Carte>
          <Carte>
            <CarteEntete
              titre="Opérations par domaine"
              description={`Entrées du journal d'activité · ${periode ? formatMois(depuis, true) + ' à aujourd’hui' : 'toute la période'}`}
            />
            <Anneau donnees={anneauDomaines} libelleTotal="opérations" />
          </Carte>
        </GrilleBlocs>
      )}

      <Carte sansPadding className="gap-0 overflow-hidden">
        <JournalActivite
          lignes={journal.data}
          profil={utilisateur?.profil}
          domaines={domaines}
          chargement={journal.isPending}
          erreur={journal.error}
          onReessayer={journal.refetch}
        />
      </Carte>
    </Page>
  )
}
