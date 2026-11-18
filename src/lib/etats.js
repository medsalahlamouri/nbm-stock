/*
 * Correspondances entre les états du back-end et les badges affichés (libellé + ton de couleur).
 * Tons : ok (vert), danger (rouge brique), warn (ocre), info (bleu ardoise), neutral (gris), dark (noir).
 */
import { pluriel } from '@/lib/format'

const ETATS_STOCK = {
  SUFFISANT: { libelle: 'Suffisant', ton: 'ok' },
  A_COMMANDER: { libelle: 'À commander', ton: 'danger' },
  COMMANDE_EN_COURS: { libelle: 'Commande en cours', ton: 'info' },
  A_PRODUIRE: { libelle: 'À produire', ton: 'warn' },
}
export const etatStock = (etat) => ETATS_STOCK[etat] ?? { libelle: etat ?? '—', ton: 'neutral' }

const ETATS_COMMANDE = {
  EN_ATTENTE: { libelle: 'En attente', ton: 'warn' },
  RECUE: { libelle: 'Reçue', ton: 'ok' },
  ANNULEE: { libelle: 'Annulée', ton: 'neutral' },
}

/**
 * État d'une commande avec la notion de retard :
 * « En retard · N j », « Prévue aujourd'hui », « Dans N jours », « Reçue », « Annulée ».
 */
export function etatCommande(commande) {
  if (commande.etat !== 'EN_ATTENTE')
    return ETATS_COMMANDE[commande.etat] ?? { libelle: commande.etat, ton: 'neutral' }
  const jours = commande.jours_restants
  if (jours === null || jours === undefined) return ETATS_COMMANDE.EN_ATTENTE
  if (jours < 0) return { libelle: `En retard · ${Math.abs(jours)} j`, ton: 'danger' }
  if (jours === 0) return { libelle: "Prévue aujourd'hui", ton: 'warn' }
  return { libelle: `Dans ${pluriel(jours, 'jour')}`, ton: 'info' }
}

const ETATS_DEMANDE = {
  EN_ATTENTE: { libelle: 'En attente', ton: 'warn' },
  FACTUREE: { libelle: 'Facturée', ton: 'ok' },
  ANNULEE: { libelle: 'Annulée', ton: 'neutral' },
}
export const etatDemande = (etat) => ETATS_DEMANDE[etat] ?? { libelle: etat ?? '—', ton: 'neutral' }

export const statutActif = (actif) =>
  actif ? { libelle: 'Actif', ton: 'ok' } : { libelle: 'Inactif', ton: 'neutral' }

export const CLASSES_ABC = {
  A: { libelle: 'Classe A', ton: 'danger' },
  B: { libelle: 'Classe B', ton: 'warn' },
  C: { libelle: 'Classe C', ton: 'ok' },
}

export const PROFILS = {
  GERANT: 'Gérant',
  CHEF_MAGASIN: 'Chef magasin',
}

/** Couleurs des séries de graphiques, dans l'ordre de la maquette */
export const COULEURS = [
  'var(--red)',
  'var(--gold)',
  'var(--green)',
  'var(--sand)',
  'var(--strong)',
  'var(--blue)',
  'var(--gold2)',
  'var(--muted2)',
]
