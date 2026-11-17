/*
 * A3 — Mon compte (/gerant/compte, /chef/compte), même interface pour les deux profils.
 * - Carte de profil : photo (bucket privé `photos`), nom, e-mail, profil, dates du compte.
 * - Informations personnelles : update utilisateur (sa propre ligne).
 *   Chef : e-mail et profil verrouillés (« Modifiable par le gérant »).
 *   Gérant : e-mail modifiable via l'Edge Function gerer-comptes / modifier_email.
 * - Mot de passe : vérification du mot de passe actuel, puis auth.updateUser({ password }).
 */
import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { envoyerPhoto, modifierEmail, modifierUtilisateur, retirerPhoto } from '@/api/utilisateurs'
import { changerMotDePasse } from '@/api/auth'
import { ErreurApplication, messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { formatDate, formatDateHeure } from '@/lib/format'
import { schemaIdentite, valeursIdentite } from '@/lib/schemas'
import { PROFILS } from '@/lib/etats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, LigneInfo } from '@/components/commun/Carte'
import { Champ } from '@/components/commun/Champ'
import { Avatar } from '@/components/commun/Avatar'
import { Badge } from '@/components/commun/Badge'
import { ConfirmDialog } from '@/components/commun/Dialogues'
import { SqueletteFormulaire } from '@/components/commun/Etats'
import { ChampMotDePasse, ReglesMotDePasse } from '@/pages/auth/ChampMotDePasse'
import { motDePasseValide } from '@/lib/schemas'

const schemaMotDePasse = z
  .object({
    actuel: z.string().min(1, 'Saisissez votre mot de passe actuel.'),
    nouveau: z.string().refine(motDePasseValide, 'Le mot de passe ne respecte pas toutes les règles.'),
    confirmation: z.string().min(1, 'Confirmez le nouveau mot de passe.'),
  })
  .refine((v) => v.nouveau === v.confirmation, { path: ['confirmation'], message: 'Les deux mots de passe sont différents.' })
  .refine((v) => v.nouveau !== v.actuel, { path: ['nouveau'], message: "Le nouveau mot de passe doit être différent de l'actuel." })

function CarteProfil({ utilisateur }) {
  const entree = useRef(null)
  const [confirmerRetrait, setConfirmerRetrait] = useState(false)
  const photo = useMutation({
    mutationFn: (fichier) => envoyerPhoto(utilisateur.id_utilisateur, fichier),
    onSuccess: async () => {
      await invalider('comptes', 'photo')
      toast.success('Photo mise à jour.')
    },
    onError: (e) => toast.error(messageErreur(e)),
  })
  const retrait = useMutation({
    mutationFn: () => retirerPhoto(utilisateur.id_utilisateur, utilisateur.photo),
    onSuccess: async () => {
      await invalider('comptes', 'photo')
      toast.success('Photo retirée.')
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  return (
    <Carte className="items-center gap-0 p-7 text-center">
      <div className="relative">
        <Avatar utilisateur={utilisateur} taille={112} className="font-serif" />
        {photo.isPending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white">
            <Loader2 className="size-6 animate-spin" />
          </span>
        )}
      </div>
      <p className="mt-4 text-[18px] font-semibold text-ink">
        {utilisateur.prenom} {utilisateur.nom}
      </p>
      <p className="text-[14px] text-mutedtxt">{utilisateur.email}</p>
      <Badge ton="dark" className="mt-3">
        {PROFILS[utilisateur.profil]}
      </Badge>
      <input
        ref={entree}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Choisir une photo"
        onChange={(e) => {
          const fichier = e.target.files?.[0]
          if (fichier) photo.mutate(fichier)
          e.target.value = ''
        }}
      />
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => entree.current?.click()} disabled={photo.isPending}>
          <Camera /> {utilisateur.photo ? 'Changer la photo' : 'Ajouter une photo'}
        </Button>
        {utilisateur.photo && (
          <Button variant="danger" size="sm" onClick={() => setConfirmerRetrait(true)} disabled={retrait.isPending} aria-label="Retirer la photo">
            <Trash2 />
          </Button>
        )}
      </div>
      <p className="mt-2 text-[12px] text-muted2">JPG, PNG ou WebP · 2 Mo maximum</p>
      <dl className="mt-5 w-full border-t border-line pt-4 text-left">
        <LigneInfo libelle="Compte créé le" fort>
          {formatDate(utilisateur.date_creation)}
        </LigneInfo>
        <LigneInfo libelle="Dernière connexion" fort>
          {formatDateHeure(utilisateur.derniere_connexion).replace(' à ', ' · ')}
        </LigneInfo>
      </dl>
      <ConfirmDialog
        ouvert={confirmerRetrait}
        onOuvertChange={setConfirmerRetrait}
        titre="Retirer la photo ?"
        message="Vos initiales seront affichées à la place de la photo."
        libelleConfirmer="Retirer la photo"
        onConfirmer={() => retrait.mutateAsync()}
      />
    </Carte>
  )
}

function FormulaireInformations({ utilisateur }) {
  const gerant = utilisateur.profil === 'GERANT'
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(schemaIdentite), values: valeursIdentite(utilisateur) })

  const soumettre = async (valeurs) => {
    try {
      if (gerant && valeurs.email !== utilisateur.email) await modifierEmail(valeurs.email)
      await modifierUtilisateur(utilisateur.id_utilisateur, valeurs)
      await invalider('comptes')
      reset(valeurs)
      toast.success('Informations enregistrées.')
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }

  return (
    <Carte as="form" onSubmit={handleSubmit(soumettre)} noValidate>
      <CarteEntete titre="Informations personnelles" />
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <Champ libelle="Prénom" obligatoire erreur={errors.prenom?.message}>
          <Input autoComplete="given-name" {...register('prenom')} />
        </Champ>
        <Champ libelle="Nom" obligatoire erreur={errors.nom?.message}>
          <Input autoComplete="family-name" {...register('nom')} />
        </Champ>
        <Champ
          libelle="Adresse e-mail"
          erreur={errors.email?.message}
          aide={gerant ? "Sert d'identifiant de connexion" : 'Modifiable par le gérant uniquement'}
          verrouille={!gerant}
          infoVerrou="Modifiable par le gérant"
        >
          <Input type="email" autoComplete="email" readOnly={!gerant} {...register('email')} />
        </Champ>
        <Champ libelle="Téléphone" erreur={errors.telephone?.message}>
          <Input type="tel" inputMode="numeric" autoComplete="tel" placeholder="8 chiffres" {...register('telephone')} />
        </Champ>
        <Champ libelle="Date de naissance" erreur={errors.date_naissance?.message}>
          <Input type="date" {...register('date_naissance')} />
        </Champ>
        <Champ libelle="Profil" verrouille infoVerrou="Le profil ne se modifie pas">
          <Input value={PROFILS[utilisateur.profil]} readOnly tabIndex={-1} />
        </Champ>
        <Champ libelle="Adresse" erreur={errors.adresse?.message} className="sm:col-span-2">
          <Input autoComplete="street-address" {...register('adresse')} />
        </Champ>
        <Champ libelle="Ville" erreur={errors.ville?.message}>
          <Input autoComplete="address-level2" {...register('ville')} />
        </Champ>
        <Champ libelle="Code postal" erreur={errors.code_postal?.message}>
          <Input inputMode="numeric" autoComplete="postal-code" {...register('code_postal')} />
        </Champ>
      </div>
      <div className="flex justify-end gap-2">
        {isDirty && (
          <Button type="button" variant="ghost" onClick={() => reset()}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </Carte>
  )
}

function FormulaireMotDePasse({ utilisateur }) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schemaMotDePasse), defaultValues: { actuel: '', nouveau: '', confirmation: '' } })
  const nouveau = useWatch({ control, name: 'nouveau' })

  const soumettre = async ({ actuel, nouveau: motDePasse }) => {
    try {
      // Vérifie le mot de passe actuel avant de le remplacer
      const { error } = await supabase.auth.signInWithPassword({ email: utilisateur.email, password: actuel })
      if (error) throw new ErreurApplication('Mot de passe actuel incorrect.')
      await changerMotDePasse(motDePasse)
      reset()
      toast.success('Mot de passe modifié.')
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }

  return (
    <Carte as="form" onSubmit={handleSubmit(soumettre)} noValidate>
      <CarteEntete titre="Mot de passe" description="8 caractères minimum, avec une majuscule, une minuscule et un chiffre" />
      <div className="grid gap-x-5 gap-y-4 md:grid-cols-3">
        <Champ libelle="Mot de passe actuel" erreur={errors.actuel?.message}>
          <ChampMotDePasse autoComplete="current-password" className="h-11" {...register('actuel')} />
        </Champ>
        <Champ libelle="Nouveau mot de passe" erreur={errors.nouveau?.message}>
          <ChampMotDePasse autoComplete="new-password" className="h-11" {...register('nouveau')} />
        </Champ>
        <Champ libelle="Confirmation" erreur={errors.confirmation?.message}>
          <ChampMotDePasse autoComplete="new-password" className="h-11" {...register('confirmation')} />
        </Champ>
      </div>
      {nouveau && <ReglesMotDePasse valeur={nouveau} />}
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Changer le mot de passe
        </Button>
      </div>
    </Carte>
  )
}

export default function MonCompte() {
  const { utilisateur } = useAuth()

  return (
    <Page>
      <PageEntete titre="Mon compte" description="Vos informations personnelles et votre mot de passe." />
      {!utilisateur ? (
        <SqueletteFormulaire />
      ) : (
        <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(280px,1fr)_2fr]">
          <CarteProfil utilisateur={utilisateur} />
          <div className="flex min-w-0 flex-col gap-[18px]">
            <FormulaireInformations utilisateur={utilisateur} />
            <FormulaireMotDePasse utilisateur={utilisateur} />
          </div>
        </div>
      )}
    </Page>
  )
}
