/*
 * Traduction des erreurs Supabase en messages clairs, en français.
 * - Les fonctions RPC du back-end lèvent déjà des messages en français : ils sont affichés tels quels.
 * - Les erreurs techniques connues (réseau, droits, contraintes) sont reformulées.
 * - Les Edge Functions renvoient { erreur } dans le corps de la réponse HTTP : on le lit.
 */

const MESSAGES_TECHNIQUES = [
  [
    /failed to fetch|networkerror|load failed|fetch failed/i,
    'Connexion au serveur impossible. Vérifiez votre accès à Internet puis réessayez.',
  ],
  [/jwt expired|invalid jwt|refresh token/i, 'Votre session a expiré. Reconnectez-vous.'],
  [
    /permission denied|row-level security|violates row-level/i,
    "Vous n'avez pas les droits nécessaires pour cette opération.",
  ],
  [/duplicate key value.*code/i, 'Ce code est déjà utilisé par un autre produit.'],
  [/duplicate key value.*numero/i, 'Ce numéro de facture existe déjà.'],
  [/duplicate key value/i, 'Cet élément existe déjà.'],
  [
    /violates foreign key constraint/i,
    "Cet élément est utilisé par d'autres données : il ne peut pas être supprimé.",
  ],
  [
    /violates check constraint/i,
    "Une valeur saisie n'est pas acceptée (vérifiez les montants et les quantités).",
  ],
  [/invalid login credentials/i, 'E-mail ou mot de passe incorrect.'],
  [
    /password should be at least|weak password|password is known/i,
    'Mot de passe trop faible : 8 caractères minimum, avec des lettres et des chiffres.',
  ],
  [/new password should be different/i, "Le nouveau mot de passe doit être différent de l'ancien."],
  [
    /email rate limit|over_request_rate_limit|too many requests/i,
    'Trop de tentatives : patientez quelques instants avant de réessayer.',
  ],
]

/** Message lisible pour n'importe quelle erreur (Error, PostgrestError, AuthError…) */
export function messageErreur(erreur, parDefaut = 'Une erreur est survenue. Réessayez.') {
  if (!erreur) return parDefaut
  const brut =
    typeof erreur === 'string'
      ? erreur
      : erreur.message || erreur.erreur || erreur.error_description || ''
  if (!brut) return parDefaut
  for (const [motif, message] of MESSAGES_TECHNIQUES) {
    if (motif.test(brut)) return message
  }
  return brut
}

/** Erreur métier portant un message déjà rédigé pour l'utilisateur */
export class ErreurApplication extends Error {
  constructor(message, details) {
    super(message)
    this.name = 'ErreurApplication'
    this.details = details
  }
}

/**
 * Déballe une réponse supabase-js { data, error } : renvoie data ou lève une erreur au message lisible.
 */
export function deballer({ data, error }) {
  if (error) throw new ErreurApplication(messageErreur(error), error)
  return data
}

/**
 * Lit le message d'erreur d'une Edge Function. En cas d'erreur HTTP, supabase-js fournit la réponse
 * dans error.context : son corps JSON contient { erreur }.
 */
export async function messageErreurFonction(error) {
  try {
    const corps = await error?.context?.json?.()
    if (corps?.erreur) return corps.erreur
    if (corps?.error) return messageErreur(corps.error)
  } catch {
    // corps illisible : message générique ci-dessous
  }
  return messageErreur(error)
}
