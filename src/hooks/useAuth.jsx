/*
 * Contexte d'authentification.
 * - Suit la session Supabase (getSession au démarrage puis onAuthStateChange).
 * - Charge la ligne `utilisateur` de la personne connectée (profil, nom, photo, doit_changer_mdp, actif).
 * - Si le compte a été désactivé entre-temps : déconnexion immédiate.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/requetes'
import { lireUtilisateur } from '@/api/utilisateurs'
import { seConnecter, seDeconnecter } from '@/api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = session en cours de lecture ; null = personne n'est connecté
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    let actif = true
    supabase.auth.getSession().then(({ data }) => actif && setSession(data.session ?? null))
    // Ne jamais appeler Supabase dans ce rappel (risque de blocage) : on mémorise seulement la session
    const { data } = supabase.auth.onAuthStateChange((_evenement, nouvelle) => {
      setSession(nouvelle ?? null)
      if (!nouvelle) queryClient.clear()
    })
    return () => {
      actif = false
      data.subscription.unsubscribe()
    }
  }, [])

  const idUtilisateur = session?.user?.id
  const requeteMoi = useQuery({
    queryKey: ['moi', idUtilisateur],
    queryFn: () => lireUtilisateur(idUtilisateur),
    enabled: Boolean(idUtilisateur),
    staleTime: 60_000,
  })
  const utilisateur = requeteMoi.data ?? null

  // Compte désactivé pendant la session : on déconnecte
  useEffect(() => {
    if (utilisateur && utilisateur.actif === false) {
      toast.error('Compte désactivé : contactez le gérant.')
      seDeconnecter()
    }
  }, [utilisateur])

  const connexion = useCallback(async (email, motDePasse) => {
    const resultat = await seConnecter(email, motDePasse)
    await queryClient.invalidateQueries({ queryKey: ['moi'] })
    return resultat
  }, [])

  const deconnexion = useCallback(async () => {
    await seDeconnecter()
    queryClient.clear()
  }, [])

  const valeur = useMemo(
    () => ({
      session,
      utilisateur,
      // Chargement tant que la session ou la ligne utilisateur n'est pas connue
      chargement: session === undefined || (Boolean(idUtilisateur) && requeteMoi.isPending),
      erreurProfil: requeteMoi.error,
      estGerant: utilisateur?.profil === 'GERANT',
      estChef: utilisateur?.profil === 'CHEF_MAGASIN',
      connexion,
      deconnexion,
      recharger: () => requeteMoi.refetch(),
    }),
    [session, utilisateur, idUtilisateur, requeteMoi, connexion, deconnexion],
  )

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const contexte = useContext(AuthContext)
  if (!contexte) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return contexte
}

/** Chemin du tableau de bord selon le profil */
// oxlint-disable-next-line react/only-export-components
export function accueilDuProfil(profil) {
  return profil === 'GERANT' ? '/gerant' : profil === 'CHEF_MAGASIN' ? '/chef' : '/connexion'
}
