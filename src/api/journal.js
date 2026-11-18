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
  REINIT_MDP: { libelle: 'Réinitialisation du mot de passe', ton: 'warn' },
  MODIFICATION_EMAIL: { libelle: "Modification de l'e-mail", ton: 'info' },
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
  return (
    ACTIONS[action] ?? {
      libelle: String(action ?? '')
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase()),
      ton: 'neutral',
    }
  )
}

/** Domaines utilisés par les onglets de filtre (objets et actions concernés) */
export const DOMAINES_JOURNAL = {
  stock: { objets: ['produit', 'mouvement_stock'], actions: ['MOUVEMENT', 'INVENTAIRE'] },
  achats: {
    objets: ['fournisseur', 'devis', 'commande_fournisseur', 'facture_fournisseur'],
    actions: ['COMMANDE', 'FACTURE_FOURNISSEUR'],
  },
  ventes: {
    objets: ['client', 'demande_client', 'ligne_demande', 'facture_client'],
    actions: ['FACTURE_CLIENT', 'DEMANDE'],
  },
  comptes: {
    objets: ['utilisateur', 'base'],
    actions: [
      'CONNEXION',
      'CHANGEMENT_MDP',
      'CREATION_COMPTE',
      'REINIT_MDP',
      'MODIFICATION_EMAIL',
      'SAUVEGARDE',
    ],
  },
  statistiques: { objets: ['produit'], actions: ['MODIFICATION'] },
}

/** Domaines affichés (badge et onglets) */
export const LIBELLES_DOMAINES = {
  stock: { libelle: 'Stock', ton: 'neutral' },
  achats: { libelle: 'Achats', ton: 'info' },
  ventes: { libelle: 'Ventes', ton: 'ok' },
  comptes: { libelle: 'Comptes', ton: 'warn' },
  statistiques: { libelle: 'Statistiques', ton: 'gold' },
  connexion: { libelle: 'Connexion', ton: 'neutral' },
  autre: { libelle: 'Autre', ton: 'neutral' },
}

/**
 * Domaine d'une ligne du journal.
 * Gérant : les modifications de produits sont des réglages de paramètres de calcul (« Statistiques »).
 * Chef : connexions et changements de mot de passe forment le domaine « Connexion ».
 */
export function domaineLigne(ligne, profil) {
  if (['CONNEXION', 'CHANGEMENT_MDP'].includes(ligne.action))
    return profil === 'GERANT' ? 'comptes' : 'connexion'
  if (profil === 'GERANT' && ligne.objet === 'produit' && ligne.action === 'MODIFICATION')
    return 'statistiques'
  for (const nom of ['stock', 'achats', 'ventes', 'comptes']) {
    const d = DOMAINES_JOURNAL[nom]
    if (d.objets.includes(ligne.objet) || d.actions.includes(ligne.action)) return nom
  }
  return 'autre'
}

const OBJETS = {
  fournisseur: ['Fournisseur', 'm'],
  devis: ['Devis', 'm'],
  produit: ['Produit', 'm'],
  client: ['Client', 'm'],
  utilisateur: ['Compte', 'm'],
  demande_client: ['Demande', 'f'],
  ligne_demande: ['Demande', 'f'],
  commande_fournisseur: ['Commande', 'f'],
  facture_fournisseur: ['Facture fournisseur', 'f'],
  facture_client: ['Facture client', 'f'],
  mouvement_stock: ['Mouvement', 'm'],
}
const PARTICIPES = {
  AJOUT: ['ajouté', 'enregistrée'],
  MODIFICATION: ['modifié', 'modifiée'],
  SUPPRESSION: ['supprimé', 'supprimée'],
  DESACTIVATION: ['désactivé', 'désactivée'],
  REACTIVATION: ['réactivé', 'réactivée'],
  ANNULATION: ['annulé', 'annulée'],
}
const OPERATIONS = {
  MOUVEMENT: 'Mouvement de stock',
  INVENTAIRE: 'Inventaire validé',
  COMMANDE: 'Commande passée',
  FACTURE_FOURNISSEUR: 'Facture fournisseur saisie',
  FACTURE_CLIENT: 'Facture client établie',
  CONNEXION: 'Connexion',
  CHANGEMENT_MDP: 'Mot de passe changé',
  CREATION_COMPTE: 'Compte chef créé',
  REINIT_MDP: 'Mot de passe réinitialisé',
  MODIFICATION_EMAIL: 'E-mail modifié',
  SAUVEGARDE: 'Sauvegarde téléchargée',
}

/** Libellé lisible d'une opération : « Mouvement de stock », « Fournisseur ajouté », « Demande annulée »… */
export function libelleOperation(ligne) {
  if (OPERATIONS[ligne.action] && !(ligne.action === 'ANNULATION')) return OPERATIONS[ligne.action]
  const participe = PARTICIPES[ligne.action]
  const [nom, genre] = OBJETS[ligne.objet] ?? [null, 'm']
  if (participe && nom) return `${nom} ${genre === 'f' ? participe[1] : participe[0]}`
  return libelleAction(ligne.action).libelle
}

/** Toutes les lignes d'une période (compteurs et graphiques) */
export async function lireJournalPeriode({ idUtilisateur, idsUtilisateurs, depuis }) {
  return toutLire(() => {
    let requete = supabase
      .from('journal_activite')
      .select(
        'id_journal, id_utilisateur, date_heure, action, objet, detail, utilisateur(nom, prenom)',
      )
    if (idUtilisateur) requete = requete.eq('id_utilisateur', idUtilisateur)
    if (idsUtilisateurs)
      requete = requete.in(
        'id_utilisateur',
        idsUtilisateurs.length ? idsUtilisateurs : ['00000000-0000-0000-0000-000000000000'],
      )
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
  return {
    nom,
    tables: Object.fromEntries(
      Object.entries(tables).map(([t, l]) => [t, Array.isArray(l) ? l.length : 0]),
    ),
  }
}
