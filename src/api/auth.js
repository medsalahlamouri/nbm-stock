/*
 * Authentification (UC01) — docs/BACKEND.md §2.
 * Connexion par e-mail et mot de passe, enregistrement de la connexion, mot de passe provisoire, déconnexion.
 */
import { supabase } from '@/lib/supabase'
import { deballer, ErreurApplication, messageErreur } from '@/lib/erreurs'
import { appelerRpc } from '@/lib/requetes'

/**
 * Connexion : signInWithPassword puis rpc('enregistrer_connexion').
 * Si le compte est désactivé, le serveur refuse : on déconnecte et on renvoie son message.
 * @returns {{ profil: 'GERANT'|'CHEF_MAGASIN', nom, prenom, doit_changer_mdp }}
 */
export async function seConnecter(email, motDePasse) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse })
  if (error) {
    // Message volontairement vague : on ne précise pas si l'e-mail ou le mot de passe est faux
    const reseau = /fetch|network/i.test(error.message)
    throw new ErreurApplication(reseau ? messageErreur(error) : 'E-mail ou mot de passe incorrect.')
  }
  try {
    return await appelerRpc(supabase, 'enregistrer_connexion')
  } catch (erreur) {
    await supabase.auth.signOut()
    throw erreur
  }
}

export async function seDeconnecter() {
  await supabase.auth.signOut()
}

/** Remplace le mot de passe provisoire puis lève l'obligation de changement côté serveur */
export async function changerMotDePasseProvisoire(nouveau) {
  deballer(await supabase.auth.updateUser({ password: nouveau }))
  await appelerRpc(supabase, 'confirmer_changement_mdp')
}

/** Changement volontaire du mot de passe depuis « Mon compte » */
export async function changerMotDePasse(nouveau) {
  deballer(await supabase.auth.updateUser({ password: nouveau }))
}
