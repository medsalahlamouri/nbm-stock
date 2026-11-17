/*
 * B12 — Utilisateurs (/gerant/utilisateurs).
 * Comptes chef magasin uniquement : nom, e-mail, téléphone, dernière connexion, statut,
 * mot de passe provisoire en attente. Recherche + onglets Actifs / Désactivés / Tous.
 * Actions (Edge Function gerer-comptes) : réinitialiser le mot de passe, activité, modifier,
 * désactiver ou supprimer, réactiver.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Clock, Info, KeyRound, Pencil, Plus, RotateCcw, Users } from 'lucide-react'
import { useChefs } from '@/hooks/useDonnees'
import { useComptes } from '@/hooks/useComptes'
import { correspond, formatDateHeure, formatTelephone } from '@/lib/format'
import { statutActif } from '@/lib/etats'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte } from '@/components/commun/Carte'
import { Badge, BadgeEtat } from '@/components/commun/Badge'
import { CellulePrincipale, DataTable } from '@/components/commun/DataTable'
import { EtatVide } from '@/components/commun/Etats'
import { Encart } from '@/components/commun/Encart'
import { Onglets } from '@/components/commun/Onglets'
import { Recherche } from '@/components/commun/Recherche'
import { Avatar } from '@/components/commun/Avatar'
import { ActionIcone } from '@/components/commun/ActionIcone'
import { ConfirmDialog, useConfirmation } from '@/components/commun/Dialogues'
import { MotDePasseProvisoire } from '@/components/commun/MotDePasseProvisoire'

export default function Utilisateurs() {
  const naviguer = useNavigate()
  const chefs = useChefs()
  const [statut, setStatut] = useState('actifs')
  const [recherche, setRecherche] = useState('')
  const confirmationReinit = useConfirmation()
  const confirmationDesactivation = useConfirmation()
  const { reinitialisation, suppression, reactivation, provisoire, fermerProvisoire } = useComptes()

  const liste = chefs.data ?? []
  const filtres = liste.filter(
    (u) => (statut === 'tous' || (statut === 'actifs' ? u.actif : !u.actif)) && correspond(recherche, u.nom, u.prenom, u.email, u.telephone),
  )

  const colonnes = [
    {
      id: 'utilisateur',
      entete: 'Utilisateur',
      tri: (u) => `${u.nom} ${u.prenom}`,
      cellule: (u) => <CellulePrincipale avant={<Avatar utilisateur={u} taille={40} />} titre={`${u.prenom} ${u.nom}`} sousTitre={u.email} />,
    },
    { id: 'tel', entete: 'Téléphone', cellule: (u) => <span className="tabular">{formatTelephone(u.telephone)}</span> },
    {
      id: 'connexion',
      entete: 'Dernière connexion',
      tri: (u) => u.derniere_connexion ?? '',
      cellule: (u) => (u.derniere_connexion ? <span className="tabular">{formatDateHeure(u.derniere_connexion).replace(' à ', ' · ')}</span> : <span className="text-mutedtxt">Jamais</span>),
    },
    {
      id: 'statut',
      entete: 'Statut',
      cellule: (u) => (
        <div className="flex flex-wrap gap-1.5">
          <BadgeEtat etat={u.actif ? statutActif(true) : { libelle: 'Désactivé', ton: 'neutral' }} />
          {u.actif && u.doit_changer_mdp && <Badge ton="warn">MDP provisoire</Badge>}
        </div>
      ),
    },
    {
      id: 'actions',
      entete: 'Actions',
      align: 'right',
      cellule: (u) => (
        <div className="flex items-center justify-end gap-1">
          {u.actif && <ActionIcone libelle="Réinitialiser le mot de passe" icone={KeyRound} onClick={() => confirmationReinit.ouvrir(u)} />}
          <ActionIcone libelle="Activité" icone={Clock} to={`/gerant/utilisateurs/${u.id_utilisateur}?onglet=activite`} />
          <ActionIcone libelle="Modifier" icone={Pencil} to={`/gerant/utilisateurs/${u.id_utilisateur}/modifier`} />
          {u.actif ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                confirmationDesactivation.ouvrir(u)
              }}
            >
              Désactiver
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                reactivation.mutate(u)
              }}
            >
              <RotateCcw /> Réactiver
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Utilisateurs"
        description="Comptes des chefs magasin. Le compte gérant est unique et se gère depuis « Mon compte »."
        actions={
          <Button asChild>
            <Link to="/gerant/utilisateurs/nouveau">
              <Plus /> Nouveau compte
            </Link>
          </Button>
        }
      />
      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
          <Recherche valeur={recherche} onChange={setRecherche} placeholder="Rechercher (nom, e-mail, téléphone)" />
          <Onglets
            valeur={statut}
            onChange={setStatut}
            libelle="Statut"
            options={[
              { valeur: 'actifs', libelle: 'Actifs', compteur: liste.filter((u) => u.actif).length },
              { valeur: 'inactifs', libelle: 'Désactivés', compteur: liste.filter((u) => !u.actif).length },
              { valeur: 'tous', libelle: 'Tous', compteur: liste.length },
            ]}
          />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={filtres}
          cle={(u) => u.id_utilisateur}
          chargement={chefs.isPending}
          erreur={chefs.error}
          onReessayer={chefs.refetch}
          onLigneClick={(u) => naviguer(`/gerant/utilisateurs/${u.id_utilisateur}`)}
          libelleElements="compte(s)"
          classeLigne={(u) => (!u.actif ? 'opacity-70' : '')}
          vide={
            <EtatVide
              icone={Users}
              titre={liste.length ? 'Aucun compte ne correspond' : 'Aucun chef magasin'}
              message={liste.length ? 'Modifiez la recherche ou le filtre.' : 'Créez le compte du chef magasin : un mot de passe provisoire lui sera attribué.'}
              action={
                !liste.length && (
                  <Button asChild>
                    <Link to="/gerant/utilisateurs/nouveau">
                      <Plus /> Nouveau compte
                    </Link>
                  </Button>
                )
              }
            />
          }
        />
      </Carte>
      <Encart ton="neutral" icone={Info}>
        Mot de passe oublié : le gérant réinitialise le mot de passe et remet à la personne un mot de passe provisoire. L'application n'envoie aucun e-mail.
      </Encart>

      <ConfirmDialog
        {...confirmationReinit.proprietes}
        ton="principal"
        titre={`Réinitialiser le mot de passe de ${confirmationReinit.cible?.prenom ?? ''} ${confirmationReinit.cible?.nom ?? ''} ?`}
        message="Un nouveau mot de passe provisoire sera généré et affiché une seule fois. L'ancien ne fonctionnera plus."
        libelleConfirmer="Réinitialiser"
        onConfirmer={() => reinitialisation.mutateAsync(confirmationReinit.cible)}
      />
      <ConfirmDialog
        {...confirmationDesactivation.proprietes}
        titre={`Désactiver le compte de ${confirmationDesactivation.cible?.prenom ?? ''} ${confirmationDesactivation.cible?.nom ?? ''} ?`}
        message="La personne ne pourra plus se connecter. Un compte sans aucune opération est supprimé ; sinon il est désactivé et son historique conservé."
        libelleConfirmer="Désactiver"
        onConfirmer={() => suppression.mutateAsync(confirmationDesactivation.cible)}
      />
      <MotDePasseProvisoire ouvert={Boolean(provisoire)} onFermer={fermerProvisoire} motDePasse={provisoire?.motDePasse} personne={provisoire?.personne} titre="Nouveau mot de passe provisoire" />
    </Page>
  )
}
