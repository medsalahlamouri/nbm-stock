/*
 * Formatage des valeurs affichées (docs/docs/CONVENTIONS.md §4 règle 19) :
 * - montants : « 1 234,500 DT » (3 décimales) dans les documents, arrondis dans les indicateurs ;
 * - dates : « 13/11/2026 » ; date longue de l'en-tête : « Vendredi 13 novembre 2026 » ;
 * - téléphone tunisien à 8 chiffres : « 73 000 101 » ;
 * - références : CMD-019, FRN-001, FC-2026-0001 ;
 * - montant en lettres pour la facture imprimable.
 */
import { format, isValid, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

// Espace fine insécable utilisée par Intl comme séparateur de milliers : remplacée par une espace normale insécable
const nettoyer = (texte) => texte.replace(/ /g, ' ')

const formateurs = new Map()
function formateur(min, max) {
  const cle = `${min}-${max}`
  if (!formateurs.has(cle)) {
    formateurs.set(
      cle,
      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: min, maximumFractionDigits: max }),
    )
  }
  return formateurs.get(cle)
}

/** Nombre au format français : 1 234 ou 1 234,5 */
export function formatNombre(valeur, decimales = 0, decimalesMax = decimales) {
  if (valeur === null || valeur === undefined || valeur === '' || Number.isNaN(Number(valeur))) return '—'
  return nettoyer(formateur(decimales, decimalesMax).format(Number(valeur)))
}

/** Montant de document : 1 234,500 DT */
export function formatMontant(valeur, avecUnite = true) {
  const texte = formatNombre(valeur, 3)
  return texte === '—' || !avecUnite ? texte : `${texte} DT`
}

/** Montant d'indicateur, arrondi au dinar : 33 075 DT */
export function formatMontantArrondi(valeur) {
  const texte = formatNombre(Math.round(Number(valeur ?? 0)))
  return `${texte} DT`
}

/** Montant compact pour les axes de graphiques : 32,0 k */
export function formatMilliers(valeur) {
  return `${formatNombre(Number(valeur ?? 0) / 1000, 1)} k`
}

function versDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : parseISO(String(valeur))
  return isValid(date) ? date : null
}

/** 13/11/2026 */
export function formatDate(valeur) {
  const date = versDate(valeur)
  return date ? format(date, 'dd/MM/yyyy') : '—'
}

/** 13/11/2026 à 14:57 */
export function formatDateHeure(valeur) {
  const date = versDate(valeur)
  return date ? format(date, "dd/MM/yyyy 'à' HH:mm") : '—'
}

/** 14:57 */
export function formatHeure(valeur) {
  const date = versDate(valeur)
  return date ? format(date, 'HH:mm') : '—'
}

/** Vendredi 13 novembre 2026 */
export function formatDateLongue(valeur = new Date()) {
  const date = versDate(valeur)
  if (!date) return '—'
  const texte = format(date, 'EEEE d MMMM yyyy', { locale: fr })
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

/** Mois abrégé pour les graphiques : Juin, Juil., Août, Sept. */
export function formatMoisCourt(valeur) {
  const date = versDate(valeur)
  if (!date) return '—'
  const texte = format(date, 'LLL', { locale: fr })
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

/** Mois complet : octobre 2026 */
export function formatMois(valeur, avecAnnee = false) {
  const date = versDate(valeur)
  if (!date) return '—'
  return format(date, avecAnnee ? 'MMMM yyyy' : 'MMMM', { locale: fr })
}

/** Date au format ISO (aaaa-mm-jj) pour les champs <input type="date"> et les RPC */
export function dateISO(valeur = new Date()) {
  const date = versDate(valeur)
  return date ? format(date, 'yyyy-MM-dd') : ''
}

/** Téléphone tunisien : 73000101 → 73 000 101 */
export function formatTelephone(valeur) {
  if (!valeur) return '—'
  const chiffres = String(valeur).replace(/\D/g, '')
  if (chiffres.length !== 8) return String(valeur)
  return `${chiffres.slice(0, 2)} ${chiffres.slice(2, 5)} ${chiffres.slice(5)}`
}

/** Référence lisible : reference('CMD', 19) → CMD-019 */
export function reference(prefixe, id, largeur = 3) {
  if (id === null || id === undefined) return '—'
  return `${prefixe}-${String(id).padStart(largeur, '0')}`
}

/** Jours au pluriel : 1 jour, 5 jours */
export function pluriel(nombre, singulier, pluriel = `${singulier}s`) {
  return `${formatNombre(nombre)} ${Math.abs(Number(nombre)) > 1 ? pluriel : singulier}`
}

/** Initiales : « Nabil Hamdi » → NH ; « Panneaux Industriels du Sahel » → PI */
export function initiales(...parties) {
  const mots = parties
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter((mot) => mot.length > 2 || /^[A-ZÀ-Ý]/.test(mot))
  const lettres = mots.slice(0, 2).map((mot) => mot.charAt(0).toUpperCase())
  return lettres.join('') || '?'
}

/** Normalise un texte pour une recherche insensible aux accents et à la casse */
export function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Vrai si tous les mots de la recherche figurent dans au moins un des champs */
export function correspond(recherche, ...champs) {
  const termes = normaliser(recherche).split(/\s+/).filter(Boolean)
  if (termes.length === 0) return true
  const cible = normaliser(champs.filter((c) => c !== null && c !== undefined).join(' '))
  return termes.every((terme) => cible.includes(terme))
}

/* ---------- Montant en lettres (facture imprimable) ---------- */
const UNITES = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
]
const DIZAINES = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt']

function moinsDeCent(n) {
  if (n < 20) return UNITES[n]
  const d = Math.floor(n / 10)
  let u = n % 10
  if (d === 7 || d === 9) u += 10 // 70-79 et 90-99 : soixante-dix, quatre-vingt-dix
  let texte = DIZAINES[d]
  if (u === 0) return d === 8 ? 'quatre-vingts' : texte
  if ((u === 1 || u === 11) && d !== 8 && d !== 9) texte += ' et '
  else texte += '-'
  return texte + UNITES[u]
}

function moinsDeMille(n) {
  const c = Math.floor(n / 100)
  const reste = n % 100
  let texte = ''
  if (c > 1) texte = `${UNITES[c]} cent${reste === 0 ? 's' : ''}`
  else if (c === 1) texte = 'cent'
  if (reste > 0) texte += (texte ? ' ' : '') + moinsDeCent(reste)
  return texte || 'zéro'
}

/** Entier en toutes lettres (jusqu'aux milliards) */
export function nombreEnLettres(nombre) {
  let n = Math.floor(Math.abs(Number(nombre) || 0))
  if (n === 0) return 'zéro'
  const groupes = [
    [1e9, 'milliard'],
    [1e6, 'million'],
    [1e3, 'mille'],
  ]
  const morceaux = []
  for (const [valeur, nom] of groupes) {
    const q = Math.floor(n / valeur)
    if (q > 0) {
      if (nom === 'mille') morceaux.push(q === 1 ? 'mille' : `${moinsDeMille(q).replace(/cents$/, 'cent')} mille`)
      else morceaux.push(`${moinsDeMille(q)} ${nom}${q > 1 ? 's' : ''}`)
      n %= valeur
    }
  }
  if (n > 0) morceaux.push(moinsDeMille(n))
  return morceaux.join(' ')
}

/** Montant en lettres : 9170 → « Neuf mille cent soixante-dix dinars » (+ millimes éventuels) */
export function montantEnLettres(montant) {
  const valeur = Math.round(Number(montant || 0) * 1000)
  const dinars = Math.floor(valeur / 1000)
  const millimes = valeur % 1000
  let texte = `${nombreEnLettres(dinars)} dinar${dinars > 1 ? 's' : ''}`
  if (millimes > 0) texte += ` et ${nombreEnLettres(millimes)} millime${millimes > 1 ? 's' : ''}`
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}
