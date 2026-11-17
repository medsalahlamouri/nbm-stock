/*
 * Journal d'activité (lecture seule, alimenté automatiquement par le serveur) et sauvegarde.
 */
import { supabase } from '@/lib/supabase'
import { deballer, ErreurApplication, messageErreurFonction } from '@/lib/erreurs'
import { toutLire } from '@/lib/requetes'

/** Libellés et domaines des actions enregistrées par le serveur */
export const ACTIONS = {
  CONNEXION: { libelle: 'Connexion', ton: 'neutral' },
  CHANGEMENT_MDP: { libelle: 'Mot de passe', ton: 'neutral' },
  CREATION_COMPTE: { libelle: 'Création de compte', ton: 'info' },
  REINITIALISATION_MDP: { libelle: 'Réinitialisation', ton: 'warn' },
  AJOUT: { libelle: 'Ajout', ton: 'ok' },
  MODIFICATION: { libelle: 'Modification', ton: 'info' },
  SUPPRESSION: { libelle: 'Suppression', ton: 'danger' },
  DESACTIVATION: { libelle: 'Désactivation', ton: 'warn' },
  REACTIVATION: { libelle: 'Réactivation', ton: 'ok' },
  MOUVEMENT: { libelle: 'Mouvement', ton: 'info' },
  INVENTAIRE: { libelle: 'Inventaire', ton: 'warn' },
  COMMANDE: { libelle: 'Commande', ton: 'dark' },
  ANNULATION: { libelle: 'Annulation', ton: 'danger' },
  FACTURE_FOURNISSEUR: { libelle: 'Facture fournisseur', ton: 'ok' },
  FACTURE_CLIENT: { libelle: 'Facture client', ton: 'ok' },
  DEMANDE: { libelle: 'Demande', ton: 'info' },
  SAUVEGARDE: { libelle: 'Sauvegarde', ton: 'neutral' },
}

export function libelleAction(action) {
  return ACTIONS[action] ?? { libelle: String(action ?? '').replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()), ton: 'neutral' }
}

/** Domaines utilisés par les onglets de filtre (objets et actions concernés) */
export const DOMAINES_JOURNAL = {
  stock: { objets: ['produit', 'mouvement_stock'], actions: ['MOUVEMENT', 'INVENTAIRE'] },
  achats: { objets: ['fournisseur', 'devis', 'commande_fournisseur', 'facture_fournisseur'], actions: ['COMMANDE', 'FACTURE_FOURNISSEUR'] },
  ventes: { objets: ['client', 'demande_client', 'ligne_demande', 'facture_client'], actions: ['FACTURE_CLIENT', 'DEMANDE'] },
  comptes: { objets: ['utilisateur', 'base'], actions: ['CONNEXION', 'CHANGEMENT_MDP', 'CREATION_COMPTE', 'REINITIALISATION_MDP', 'SAUVEGARDE'] },
  statistiques: { objets: ['produit'], actions: ['MODIFICATION'] },
}

/** Domaine d'une ligne du journal (pour la couleur et les compteurs) */
export function domaineLigne(ligne) {
  for (const [nom, d] of Object.entries(DOMAINES_JOURNAL)) {
    if (nom === 'statistiques') continue
    if (d.objets.includes(ligne.objet) || d.actions.includes(ligne.action)) return nom
  }
  return 'autre'
}

function filtrerDomaine(requete, domaine) {
  const d = DOMAINES_JOURNAL[domaine]
  if (!d) return requete
  if (domaine === 'statistiques') return requete.eq('objet', 'produit').eq('action', 'MODIFICATION')
  const objets = d.objets.map((o) => `"${o}"`).join(',')
  const actions = d.actions.map((a) => `"${a}"`).join(',')
  return requete.or(`objet.in.(${objets}),action.in.(${actions})`)
}

/**
 * Page du journal.
 * @param {{ idUtilisateur?: string, idsUtilisateurs?: string[], domaine?: string, depuis?: string, page?: number, taille?: number }} filtres
 */
export async function listerJournal({ idUtilisateur, idsUtilisateurs, domaine, depuis, page = 1, taille = 10 }) {
  let requete = supabase
    .from('journal_activite')
    .select('id_journal, id_utilisateur, date_heure, action, objet, detail, utilisateur(nom, prenom, profil)', { count: 'exact' })
    .order('date_heure', { ascending: false })
    .order('id_journal', { ascending: false })
  if (idUtilisateur) requete = requete.eq('id_utilisateur', idUtilisateur)
  if (idsUtilisateurs) requete = requete.in('id_utilisateur', idsUtilisateurs.length ? idsUtilisateurs : ['00000000-0000-0000-0000-000000000000'])
  if (depuis) requete = requete.gte('date_heure', depuis)
  requete = filtrerDomaine(requete, domaine)
  const debut = (page - 1) * taille
  const { data, error, count } = await requete.range(debut, debut + taille - 1)
  deballer({ data, error })
  return { lignes: data, total: count ?? 0 }
}

/** Toutes les lignes d'une période (compteurs et graphiques) */
export async function lireJournalPeriode({ idUtilisateur, idsUtilisateurs, depuis }) {
  return toutLire(() => {
    let requete = supabase.from('journal_activite').select('id_journal, id_utilisateur, date_heure, action, objet, detail')
    if (idUtilisateur) requete = requete.eq('id_utilisateur', idUtilisateur)
    if (idsUtilisateurs) requete = requete.in('id_utilisateur', idsUtilisateurs.length ? idsUtilisateurs : ['00000000-0000-0000-0000-000000000000'])
    if (depuis) requete = requete.gte('date_heure', depuis)
    return requete.order('id_journal')
  })
}

/** Dernière sauvegarde téléchargée (dernière action SAUVEGARDE du journal) */
export async function derniereSauvegarde() {
  const lignes = deballer(
    await supabase
      .from('journal_activite')
      .select('date_heure, detail, utilisateur(nom, prenom)')
      .eq('action', 'SAUVEGARDE')
      .order('date_heure', { ascending: false })
      .limit(1),
  )
  return lignes[0] ?? null
}

/** Appelle l'Edge Function `sauvegarder-donnees` et propose le fichier JSON au téléchargement */
export async function telechargerSauvegarde() {
  const { data, error } = await supabase.functions.invoke('sauvegarder-donnees')
  if (error) throw new ErreurApplication(await messageErreurFonction(error), error)
  const contenu = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  const maintenant = new Date()
  const p = (n) => String(n).padStart(2, '0')
  const nom = `sauvegarde-nbm-${maintenant.getFullYear()}-${p(maintenant.getMonth() + 1)}-${p(maintenant.getDate())}-${p(maintenant.getHours())}-${p(maintenant.getMinutes())}-${p(maintenant.getSeconds())}.json`
  const url = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  const tables = typeof data === 'object' && data?.tables ? data.tables : {}
  return { nom, tables: Object.fromEntries(Object.entries(tables).map(([t, l]) => [t, Array.isArray(l) ? l.length : 0])) }
}
