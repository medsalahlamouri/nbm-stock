/*
 * A1 — Connexion (/connexion).
 * signInWithPassword → rpc('enregistrer_connexion') → redirection selon le profil
 * (GERANT → /gerant, CHEF_MAGASIN → /chef) ou vers /changer-mot-de-passe si le mot de passe est provisoire.
 */
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { accueilDuProfil, useAuth } from '@/hooks/useAuth'
import { messageErreur } from '@/lib/erreurs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Champ } from '@/components/commun/Champ'
import { Encart } from '@/components/commun/Encart'
import { CadreAuth } from '@/pages/auth/CadreAuth'
import { ChampMotDePasse } from '@/pages/auth/ChampMotDePasse'

const schema = z.object({
  email: z.string().trim().min(1, "Saisissez votre adresse e-mail.").pipe(z.email('Adresse e-mail invalide.')),
  motDePasse: z.string().min(1, 'Saisissez votre mot de passe.'),
})

export default function Connexion() {
  const { connexion } = useAuth()
  const naviguer = useNavigate()
  const location = useLocation()
  const [erreur, setErreur] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', motDePasse: '' } })

  const soumettre = async ({ email, motDePasse }) => {
    setErreur(null)
    try {
      const resultat = await connexion(email, motDePasse)
      if (resultat?.doit_changer_mdp) {
        naviguer('/changer-mot-de-passe', { replace: true })
        return
      }
      toast.success(`Bonjour ${resultat?.prenom ?? ''}`.trim())
      const accueil = accueilDuProfil(resultat?.profil)
      const depuis = location.state?.depuis
      naviguer(depuis && depuis.startsWith(accueil) ? depuis : accueil, { replace: true })
    } catch (e) {
      setErreur(messageErreur(e))
    }
  }

  return (
    <CadreAuth>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-[-0.02em] text-strong">Connexion</h1>
      <p className="mt-2 text-[15px] text-mutedtxt">Utilisez l'adresse e-mail et le mot de passe fournis par le gérant.</p>

      <form onSubmit={handleSubmit(soumettre)} noValidate className="mt-6 flex flex-col gap-4">
        {erreur && <Encart ton="danger">{erreur}</Encart>}

        <Champ libelle="Adresse e-mail" erreur={errors.email?.message}>
          <Input type="email" autoComplete="username" autoFocus className="h-[46px]" placeholder="prenom.nom@exemple.com" {...register('email')} />
        </Champ>
        <Champ libelle="Mot de passe" erreur={errors.motDePasse?.message}>
          <ChampMotDePasse autoComplete="current-password" {...register('motDePasse')} />
        </Champ>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-2.5 border-t border-line pt-5 text-[14px] text-mutedtxt">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>Mot de passe oublié ? Adressez-vous au gérant, qui vous remettra un mot de passe provisoire.</p>
      </div>
    </CadreAuth>
  )
}
