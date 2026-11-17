/*
 * B12ter — Créer / modifier un chef magasin (/gerant/utilisateurs/nouveau, /:id/modifier).
 * Création : e-mail, nom, prénom, téléphone, date de naissance, adresse, ville, code postal
 *   → gerer-comptes / creer → fenêtre du mot de passe provisoire (affiché une seule fois).
 * Modification : update utilisateur (identité, coordonnées) ; e-mail via gerer-comptes / modifier_email.
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { toast } from 'sonner'
import { creerChef, lireUtilisateur, modifierEmail, modifierUtilisateur } from '@/api/utilisateurs'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { schemaIdentite, valeursIdentite } from '@/lib/schemas'
import { formatDate, formatDateHeure } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { Champ } from '@/components/commun/Champ'
import { Encart } from '@/components/commun/Encart'
import { EtatErreur, SqueletteFormulaire } from '@/components/commun/Etats'
import { FicheResume, PiedFormulaire, compterModifies } from '@/components/commun/Formulaire'
import { MotDePasseProvisoire } from '@/components/commun/MotDePasseProvisoire'

function Formulaire({ utilisateur }) {
  const naviguer = useNavigate()
  const modification = Boolean(utilisateur)
  const [cree, setCree] = useState(null) // { id, motDePasse, personne }
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({ resolver: zodResolver(schemaIdentite), defaultValues: valeursIdentite(utilisateur) })

  const soumettre = async (v) => {
    try {
      if (modification) {
        if (v.email !== utilisateur.email) await modifierEmail(v.email, utilisateur.id_utilisateur)
        await modifierUtilisateur(utilisateur.id_utilisateur, v)
        await invalider('comptes')
        toast.success('Compte modifié.')
        naviguer(`/gerant/utilisateurs/${utilisateur.id_utilisateur}`)
      } else {
        const champs = Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val === '' ? null : val]))
        const r = await creerChef(champs)
        await invalider('comptes')
        toast.success(`Compte de ${v.prenom} ${v.nom} créé.`)
        setCree({ id: r.id_utilisateur, motDePasse: r.mot_de_passe_provisoire, personne: `${v.prenom} ${v.nom}` })
      }
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }

  const champ = (nom, libelle, props = {}, options = {}) => (
    <Champ libelle={libelle} obligatoire={options.obligatoire} erreur={errors[nom]?.message} aide={options.aide} modifie={modification && dirtyFields[nom]} className={options.className}>
      <Input {...props} {...register(nom)} />
    </Champ>
  )

  return (
    <Page>
      <PageEntete
        titre={modification ? 'Modifier un compte' : 'Nouveau compte chef magasin'}
        description={
          modification
            ? `${utilisateur.prenom} ${utilisateur.nom} · les champs modifiés sont signalés en doré.`
            : 'Un mot de passe provisoire est généré à la création : la personne le remplacera à sa première connexion.'
        }
        badges={modification && <Badge ton="dark">Modification</Badge>}
      />
      <div className={modification ? 'grid items-start gap-[18px] lg:grid-cols-[2fr_minmax(280px,1fr)]' : 'max-w-4xl'}>
        <Carte as="form" onSubmit={handleSubmit(soumettre)} noValidate>
          <CarteEntete titre="Identité" />
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
            {champ('prenom', 'Prénom', { autoFocus: !modification }, { obligatoire: true })}
            {champ('nom', 'Nom', {}, { obligatoire: true })}
            {champ('date_naissance', 'Date de naissance', { type: 'date' })}
          </div>
          <CarteEntete titre="Coordonnées" className="mt-2" />
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {champ('email', 'Adresse e-mail', { type: 'email', autoComplete: 'off' }, { obligatoire: true, aide: "Identifiant de connexion de la personne" })}
            {champ('telephone', 'Téléphone', { type: 'tel', inputMode: 'numeric', placeholder: '8 chiffres' })}
            {champ('adresse', 'Adresse', {}, { className: 'sm:col-span-2' })}
            {champ('ville', 'Ville')}
            {champ('code_postal', 'Code postal', { inputMode: 'numeric' })}
          </div>
          {!modification && (
            <Encart ton="info" icone={Info}>
              Profil attribué : <strong>Chef magasin</strong>. Le mot de passe provisoire s'affichera une seule fois après la création, avec un bouton « Copier ».
            </Encart>
          )}
          <PiedFormulaire
            modification={modification}
            nbModifies={compterModifies(dirtyFields)}
            enCours={isSubmitting}
            onAnnuler={() => naviguer(modification ? `/gerant/utilisateurs/${utilisateur.id_utilisateur}` : '/gerant/utilisateurs')}
            libelle={modification ? undefined : 'Créer le compte'}
          />
        </Carte>
        {modification && (
          <FicheResume
            lien={`/gerant/utilisateurs/${utilisateur.id_utilisateur}`}
            lignes={[
              ['Profil', 'Chef magasin'],
              ['Statut', utilisateur.actif ? 'Actif' : 'Désactivé'],
              ['Créé le', formatDate(utilisateur.date_creation)],
              ['Dernière connexion', utilisateur.derniere_connexion ? formatDateHeure(utilisateur.derniere_connexion) : 'Jamais'],
            ]}
          />
        )}
      </div>
      <MotDePasseProvisoire
        ouvert={Boolean(cree)}
        onFermer={() => naviguer(`/gerant/utilisateurs/${cree.id}`)}
        motDePasse={cree?.motDePasse}
        personne={cree?.personne}
        titre="Compte créé : mot de passe provisoire"
      />
    </Page>
  )
}

export default function UtilisateurFormulaire() {
  const { id } = useParams()
  const requete = useQuery({ queryKey: ['utilisateur', id], queryFn: () => lireUtilisateur(id), enabled: Boolean(id) })
  if (!id) return <Formulaire />
  if (requete.isPending) return <SqueletteFormulaire champs={8} />
  if (requete.isError) return <Carte><EtatErreur erreur={requete.error} onReessayer={requete.refetch} /></Carte>
  return <Formulaire key={requete.data.id_utilisateur} utilisateur={requete.data} />
}
