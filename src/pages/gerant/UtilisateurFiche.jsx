/*
 * B12bis — Fiche utilisateur (/gerant/utilisateurs/:id).
 * Identité, coordonnées, informations du compte ; actions (Edge Function gerer-comptes) :
 * Modifier, Réinitialiser le mot de passe, Désactiver / Supprimer, Réactiver.
 * Onglet Activité : journal du chef (journal_activite filtré) et compteurs.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  Ban,
  History,
  Inbox,
  KeyRound,
  LogIn,
  Pencil,
  Receipt,
  RotateCcw,
  User,
} from 'lucide-react'
import { lireUtilisateur } from '@/api/utilisateurs'
import { lireJournalPeriode } from '@/api/journal'
import { useComptes } from '@/hooks/useComptes'
import { formatDate, formatDateHeure, formatTelephone } from '@/lib/format'
import { PROFILS } from '@/lib/etats'
import { debutPeriode, PERIODES } from '@/lib/periodes'
import { useFilAriane } from '@/components/layout/FilAriane'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, GrilleIndicateurs, LigneInfo } from '@/components/commun/Carte'
import { StatCard } from '@/components/commun/StatCard'
import { Badge } from '@/components/commun/Badge'
import { Avatar } from '@/components/commun/Avatar'
import { Onglets } from '@/components/commun/Onglets'
import { EtatErreur, SqueletteBloc } from '@/components/commun/Etats'
import { JournalActivite } from '@/components/commun/Journal'
import { ConfirmDialog } from '@/components/commun/Dialogues'
import { MotDePasseProvisoire } from '@/components/commun/MotDePasseProvisoire'

function Activite({ utilisateur }) {
  const [periode, setPeriode] = useState(90)
  const journal = useQuery({
    queryKey: ['journal', 'utilisateur', utilisateur.id_utilisateur, periode],
    queryFn: () =>
      lireJournalPeriode({
        idUtilisateur: utilisateur.id_utilisateur,
        depuis: debutPeriode(periode),
      }),
  })
  const compte = useMemo(() => {
    const c = {}
    for (const l of journal.data ?? []) c[l.action] = (c[l.action] ?? 0) + 1
    return c
  }, [journal.data])
  return (
    <>
      <div className="flex justify-end">
        <Onglets
          options={PERIODES}
          valeur={periode}
          onChange={setPeriode}
          libelle="Période"
          taille="sm"
        />
      </div>
      <GrilleIndicateurs>
        <StatCard
          libelle="Mouvements"
          valeur={(compte.MOUVEMENT ?? 0) + (compte.INVENTAIRE ?? 0)}
          sousTexte={`dont ${compte.INVENTAIRE ?? 0} inventaire(s)`}
          icone={ArrowLeftRight}
          chargement={journal.isPending}
        />
        <StatCard
          libelle="Factures client"
          valeur={compte.FACTURE_CLIENT ?? 0}
          sousTexte="établies"
          icone={Receipt}
          ton="ok"
          chargement={journal.isPending}
        />
        <StatCard
          libelle="Factures fournisseur"
          valeur={compte.FACTURE_FOURNISSEUR ?? 0}
          sousTexte="saisies et contrôlées"
          icone={Inbox}
          ton="info"
          chargement={journal.isPending}
        />
        <StatCard
          libelle="Connexions"
          valeur={compte.CONNEXION ?? 0}
          sousTexte="sur la période"
          icone={LogIn}
          chargement={journal.isPending}
        />
      </GrilleIndicateurs>
      <Carte sansPadding className="gap-0 overflow-hidden">
        <JournalActivite
          lignes={journal.data}
          profil="CHEF_MAGASIN"
          domaines={['stock', 'ventes', 'achats', 'connexion']}
          chargement={journal.isPending}
          erreur={journal.error}
          onReessayer={journal.refetch}
        />
      </Carte>
    </>
  )
}

export default function UtilisateurFiche() {
  const { id } = useParams()
  const naviguer = useNavigate()
  const [parametres, setParametres] = useSearchParams()
  const onglet = parametres.get('onglet') === 'activite' ? 'activite' : 'informations'
  const [confirmer, setConfirmer] = useState(null) // 'reinit' | 'desactiver'
  const requete = useQuery({ queryKey: ['utilisateur', id], queryFn: () => lireUtilisateur(id) })
  const { reinitialisation, suppression, reactivation, provisoire, fermerProvisoire } = useComptes({
    onSupprime: () => naviguer('/gerant/utilisateurs'),
  })
  const u = requete.data
  useFilAriane(u ? `${u.prenom} ${u.nom}` : null)

  if (requete.isPending)
    return (
      <Page>
        <SqueletteBloc hauteur={120} />
        <SqueletteBloc hauteur={260} />
      </Page>
    )
  if (requete.isError)
    return (
      <Carte>
        <EtatErreur erreur={requete.error} onReessayer={requete.refetch} />
      </Carte>
    )

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar utilisateur={u} taille={64} />
          <PageEntete
            titre={`${u.prenom} ${u.nom}`}
            description={`${PROFILS[u.profil]} · ${u.email}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {u.actif ? <Badge ton="ok">Actif</Badge> : <Badge>Désactivé</Badge>}
          {u.actif && u.doit_changer_mdp && <Badge ton="warn">MDP provisoire</Badge>}
          <Button variant="outline" asChild>
            <Link to={`/gerant/utilisateurs/${id}/modifier`}>
              <Pencil /> Modifier
            </Link>
          </Button>
          {u.actif ? (
            <>
              <Button variant="outline" onClick={() => setConfirmer('reinit')}>
                <KeyRound /> Réinitialiser le mot de passe
              </Button>
              <Button variant="danger" onClick={() => setConfirmer('desactiver')}>
                <Ban /> Désactiver
              </Button>
            </>
          ) : (
            <Button onClick={() => reactivation.mutate(u)} disabled={reactivation.isPending}>
              <RotateCcw /> Réactiver
            </Button>
          )}
        </div>
      </div>

      <Onglets
        valeur={onglet}
        onChange={(v) => setParametres(v === 'activite' ? { onglet: v } : {}, { replace: true })}
        libelle="Fiche"
        options={[
          { valeur: 'informations', libelle: 'Informations', icone: User },
          { valeur: 'activite', libelle: 'Activité', icone: History },
        ]}
        className="self-start"
      />

      {onglet === 'activite' ? (
        <Activite utilisateur={u} />
      ) : (
        <div className="grid items-start gap-[18px] lg:grid-cols-3">
          <Carte>
            <CarteEntete titre="Identité" />
            <dl>
              <LigneInfo libelle="Prénom">{u.prenom}</LigneInfo>
              <LigneInfo libelle="Nom">{u.nom}</LigneInfo>
              <LigneInfo libelle="Date de naissance">{formatDate(u.date_naissance)}</LigneInfo>
            </dl>
          </Carte>
          <Carte>
            <CarteEntete titre="Coordonnées" />
            <dl>
              <LigneInfo libelle="E-mail">{u.email}</LigneInfo>
              <LigneInfo libelle="Téléphone">{formatTelephone(u.telephone)}</LigneInfo>
              <LigneInfo libelle="Adresse">{u.adresse || '—'}</LigneInfo>
              <LigneInfo libelle="Ville">
                {[u.code_postal, u.ville].filter(Boolean).join(' ') || '—'}
              </LigneInfo>
            </dl>
          </Carte>
          <Carte>
            <CarteEntete titre="Informations du compte" />
            <dl>
              <LigneInfo libelle="Profil">{PROFILS[u.profil]}</LigneInfo>
              <LigneInfo libelle="Créé le">{formatDate(u.date_creation)}</LigneInfo>
              <LigneInfo libelle="Dernière connexion">
                {u.derniere_connexion ? formatDateHeure(u.derniere_connexion) : 'Jamais'}
              </LigneInfo>
              <LigneInfo libelle="Mot de passe">
                {u.doit_changer_mdp ? 'Provisoire (à changer)' : 'Personnel'}
              </LigneInfo>
            </dl>
          </Carte>
        </div>
      )}

      <ConfirmDialog
        ouvert={confirmer === 'reinit'}
        onOuvertChange={(o) => !o && setConfirmer(null)}
        ton="principal"
        titre={`Réinitialiser le mot de passe de ${u.prenom} ${u.nom} ?`}
        message="Un nouveau mot de passe provisoire sera généré et affiché une seule fois. L'ancien ne fonctionnera plus."
        libelleConfirmer="Réinitialiser"
        onConfirmer={() => reinitialisation.mutateAsync(u)}
      />
      <ConfirmDialog
        ouvert={confirmer === 'desactiver'}
        onOuvertChange={(o) => !o && setConfirmer(null)}
        titre={`Désactiver le compte de ${u.prenom} ${u.nom} ?`}
        message="La personne ne pourra plus se connecter. Un compte sans aucune opération est supprimé ; sinon il est désactivé et son historique conservé."
        libelleConfirmer="Désactiver"
        onConfirmer={() => suppression.mutateAsync(u)}
      />
      <MotDePasseProvisoire
        ouvert={Boolean(provisoire)}
        onFermer={fermerProvisoire}
        motDePasse={provisoire?.motDePasse}
        personne={provisoire?.personne}
        titre="Nouveau mot de passe provisoire"
      />
    </Page>
  )
}
