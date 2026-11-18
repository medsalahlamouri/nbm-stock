/*
 * A2 — Changer le mot de passe provisoire (/changer-mot-de-passe).
 * Accessible uniquement si utilisateur.doit_changer_mdp. auth.updateUser({ password })
 * puis rpc('confirmer_changement_mdp') → tableau de bord.
 */
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { accueilDuProfil, useAuth } from '@/hooks/useAuth'
import { changerMotDePasseProvisoire } from '@/api/auth'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { Button } from '@/components/ui/button'
import { Champ } from '@/components/commun/Champ'
import { Encart } from '@/components/commun/Encart'
import { Badge } from '@/components/commun/Badge'
import { CadreAuth } from '@/pages/auth/CadreAuth'
import { ChampMotDePasse, ReglesMotDePasse } from '@/components/commun/ChampMotDePasse'
import { motDePasseValide } from '@/lib/schemas'

const schema = z
  .object({
    nouveau: z
      .string()
      .refine(motDePasseValide, 'Le mot de passe ne respecte pas toutes les règles.'),
    confirmation: z.string().min(1, 'Confirmez le mot de passe.'),
  })
  .refine((v) => v.nouveau === v.confirmation, {
    path: ['confirmation'],
    message: 'Les deux mots de passe sont différents.',
  })

export default function ChangerMotDePasse() {
  const { utilisateur, deconnexion } = useAuth()
  const naviguer = useNavigate()
  const [erreur, setErreur] = useState(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { nouveau: '', confirmation: '' } })
  const nouveau = useWatch({ control, name: 'nouveau' })

  // Écran réservé au mot de passe provisoire
  if (utilisateur && !utilisateur.doit_changer_mdp)
    return <Navigate to={accueilDuProfil(utilisateur.profil)} replace />

  const soumettre = async ({ nouveau: motDePasse }) => {
    setErreur(null)
    try {
      await changerMotDePasseProvisoire(motDePasse)
      await invalider('comptes')
      toast.success('Mot de passe enregistré. Bienvenue !')
      naviguer(accueilDuProfil(utilisateur?.profil), { replace: true })
    } catch (e) {
      setErreur(messageErreur(e))
    }
  }

  const quitter = async () => {
    await deconnexion()
    naviguer('/connexion', { replace: true })
  }

  return (
    <CadreAuth>
      <Badge ton="warn" className="mb-3 w-full justify-start rounded-full px-3 text-[13px]">
        Première connexion
      </Badge>
      <h1 className="text-strong font-serif text-[26px] leading-tight font-semibold tracking-[-0.02em]">
        Choisissez votre mot de passe
      </h1>
      <p className="text-mutedtxt mt-2 text-[15px]">
        Bonjour {utilisateur?.prenom}. Votre mot de passe actuel est provisoire : remplacez-le pour
        accéder à l'application.
      </p>

      <form onSubmit={handleSubmit(soumettre)} noValidate className="mt-6 flex flex-col gap-4">
        {erreur && <Encart ton="danger">{erreur}</Encart>}
        <Champ libelle="Nouveau mot de passe" erreur={errors.nouveau?.message}>
          <ChampMotDePasse autoComplete="new-password" autoFocus {...register('nouveau')} />
        </Champ>
        <ReglesMotDePasse valeur={nouveau} />
        <Champ libelle="Confirmer le mot de passe" erreur={errors.confirmation?.message}>
          <ChampMotDePasse autoComplete="new-password" {...register('confirmation')} />
        </Champ>
        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Enregistrer et continuer
        </Button>
      </form>

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={quitter}
          className="text-mutedtxt hover:text-ink cursor-pointer text-[14px] underline underline-offset-4"
        >
          Se déconnecter
        </button>
      </div>
    </CadreAuth>
  )
}
