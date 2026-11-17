/*
 * Comptes utilisateurs — table `utilisateur`, Storage `photos`, Edge Function `gerer-comptes`.
 */
import { supabase } from '@/lib/supabase'
import { deballer, ErreurApplication, messageErreurFonction } from '@/lib/erreurs'

const COLONNES =
  'id_utilisateur, nom, prenom, email, telephone, date_naissance, adresse, ville, code_postal, photo, profil, actif, doit_changer_mdp, date_creation, derniere_connexion'

/** Ligne `utilisateur` de la personne connectée (la RLS ne laisse voir que la sienne au chef) */
export async function lireUtilisateur(id) {
  return deballer(await supabase.from('utilisateur').select(COLONNES).eq('id_utilisateur', id).single())
}

/** Comptes chef magasin (gérant) */
export async function listerChefs() {
  return deballer(
    await supabase.from('utilisateur').select(COLONNES).eq('profil', 'CHEF_MAGASIN').order('nom').order('prenom'),
  )
}

/** Mise à jour de l'identité et des coordonnées (jamais e-mail, profil ni actif ici) */
export async function modifierUtilisateur(id, champs) {
  const autorises = ['nom', 'prenom', 'telephone', 'date_naissance', 'adresse', 'ville', 'code_postal', 'photo']
  const donnees = Object.fromEntries(
    Object.entries(champs)
      .filter(([cle]) => autorises.includes(cle))
      .map(([cle, valeur]) => [cle, valeur === '' ? null : valeur]),
  )
  return deballer(
    await supabase.from('utilisateur').update(donnees).eq('id_utilisateur', id).select(COLONNES).single(),
  )
}

/* ---------- Photos de profil (bucket privé `photos`) ---------- */

/** Envoie la photo dans photos/<id>/avatar.<ext> puis enregistre le chemin dans utilisateur.photo */
export async function envoyerPhoto(id, fichier) {
  const extension = (fichier.name.split('.').pop() || 'jpg').toLowerCase()
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    throw new ErreurApplication('Format non accepté : choisissez une image JPG, PNG ou WebP.')
  }
  if (fichier.size > 2 * 1024 * 1024) throw new ErreurApplication('Image trop lourde : 2 Mo maximum.')
  const chemin = `${id}/avatar.${extension}`
  deballer(
    await supabase.storage.from('photos').upload(chemin, fichier, { upsert: true, contentType: fichier.type }),
  )
  return modifierUtilisateur(id, { photo: chemin })
}

/** Retire la photo (le fichier est supprimé, la colonne remise à vide) */
export async function retirerPhoto(id, chemin) {
  if (chemin) await supabase.storage.from('photos').remove([chemin])
  return modifierUtilisateur(id, { photo: null })
}

/** URL signée valable 1 h pour afficher une photo du bucket privé */
export async function urlPhoto(chemin) {
  if (!chemin) return null
  const { data, error } = await supabase.storage.from('photos').createSignedUrl(chemin, 3600)
  return error ? null : data.signedUrl
}

/* ---------- Edge Function gerer-comptes (gérant) ---------- */

async function gererComptes(corps) {
  const { data, error } = await supabase.functions.invoke('gerer-comptes', { body: corps })
  if (error) throw new ErreurApplication(await messageErreurFonction(error), error)
  if (data?.erreur) throw new ErreurApplication(data.erreur)
  return data
}

/** Crée un compte chef magasin → { id_utilisateur, mot_de_passe_provisoire } */
export const creerChef = (champs) => gererComptes({ action: 'creer', ...champs })

/** Nouveau mot de passe provisoire → { mot_de_passe_provisoire } */
export const reinitialiserMotDePasse = (id) => gererComptes({ action: 'reinitialiser_mdp', id_utilisateur: id })

/** Change l'e-mail de connexion (sans id : le gérant lui-même) */
export const modifierEmail = (email, id) =>
  gererComptes({ action: 'modifier_email', email, ...(id ? { id_utilisateur: id } : {}) })

/** → { resultat: 'SUPPRIME' | 'DESACTIVE' } */
export const supprimerOuDesactiverCompte = (id) => gererComptes({ action: 'supprimer_ou_desactiver', id_utilisateur: id })

export const reactiverCompte = (id) => gererComptes({ action: 'reactiver', id_utilisateur: id })
