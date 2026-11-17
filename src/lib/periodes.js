/*
 * Périodes d'analyse proposées dans les écrans d'activité et de statistiques.
 */

/** Périodes proposées dans les écrans d'activité */
export const PERIODES = [
  { valeur: 30, libelle: '30 jours' },
  { valeur: 90, libelle: '90 jours' },
  { valeur: 365, libelle: '12 mois' },
  { valeur: 0, libelle: 'Tout' },
]

/** Date ISO de début d'une période en jours (0 = depuis toujours) */
export function debutPeriode(jours) {
  if (!jours) return undefined
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - jours + 1)
  return date.toISOString()
}
