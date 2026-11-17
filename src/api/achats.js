/*
 * Achats (gérant) et réception (chef) — fournisseurs, devis, commandes, factures fournisseur.
 * Les commandes et factures s'écrivent uniquement par RPC (passer_commande, annuler_commande,
 * saisir_facture_fournisseur). Fournisseurs et devis : écritures directes autorisées au gérant.
 */
import { supabase } from '@/lib/supabase'
import { deballer } from '@/lib/erreurs'
import { appelerRpc } from '@/lib/requetes'

const vide = (v) => (v === '' || v === undefined ? null : v)

/* ---------- Fournisseurs ---------- */

/** Fournisseurs avec le nombre de devis et de commandes */
export async function listerFournisseurs() {
  const lignes = deballer(
    await supabase
      .from('fournisseur')
      .select('*, devis(id_devis, commande_fournisseur(id_commande))')
      .order('raison_sociale'),
  )
  return lignes.map(({ devis, ...f }) => ({
    ...f,
    nb_devis: devis?.length ?? 0,
    nb_commandes: devis?.reduce((n, d) => n + (d.commande_fournisseur?.length ?? 0), 0) ?? 0,
  }))
}

export async function lireFournisseur(id) {
  return deballer(await supabase.from('fournisseur').select('*').eq('id_fournisseur', id).single())
}

export async function creerFournisseur({ raison_sociale, adresse, telephone, email }) {
  return deballer(
    await supabase
      .from('fournisseur')
      .insert({ raison_sociale: raison_sociale.trim(), adresse: vide(adresse), telephone: vide(telephone), email: vide(email) })
      .select()
      .single(),
  )
}

export async function modifierFournisseur(id, { raison_sociale, adresse, telephone, email }) {
  return deballer(
    await supabase
      .from('fournisseur')
      .update({ raison_sociale: raison_sociale.trim(), adresse: vide(adresse), telephone: vide(telephone), email: vide(email) })
      .eq('id_fournisseur', id)
      .select()
      .single(),
  )
}

/** Évaluation des fournisseurs (délais annoncés / réels, retard moyen) */
export async function listerEvaluations() {
  return deballer(await supabase.from('v_evaluation_fournisseurs').select('*').order('raison_sociale'))
}

/* ---------- Devis ---------- */

const SELECT_DEVIS =
  '*, fournisseur(id_fournisseur, raison_sociale, actif), produit(id_produit, code, designation, unite, quantite_economique, actif), commande_fournisseur(id_commande)'

/** Devis avec fournisseur, matière première et indicateur « utilisé dans une commande » */
export async function listerDevis(filtres = {}) {
  let requete = supabase.from('devis').select(SELECT_DEVIS).order('date_devis', { ascending: false })
  if (filtres.idFournisseur) requete = requete.eq('id_fournisseur', filtres.idFournisseur)
  if (filtres.idProduit) requete = requete.eq('id_produit', filtres.idProduit)
  return deballer(await requete).map((d) => ({ ...d, utilise: (d.commande_fournisseur?.length ?? 0) > 0 }))
}

export async function lireDevis(id) {
  const d = deballer(await supabase.from('devis').select(SELECT_DEVIS).eq('id_devis', id).single())
  return { ...d, utilise: (d.commande_fournisseur?.length ?? 0) > 0 }
}

function champsDevis({ id_fournisseur, id_produit, date_devis, prix_unitaire, delai_livraison }) {
  return {
    id_fournisseur: Number(id_fournisseur),
    id_produit: Number(id_produit),
    date_devis,
    prix_unitaire: Number(prix_unitaire),
    delai_livraison: Number(delai_livraison),
  }
}

export async function creerDevis(champs) {
  return deballer(await supabase.from('devis').insert(champsDevis(champs)).select().single())
}

export async function modifierDevis(id, champs) {
  return deballer(await supabase.from('devis').update(champsDevis(champs)).eq('id_devis', id).select().single())
}

/** Suppression directe : le serveur refuse si le devis est utilisé dans une commande */
export async function supprimerDevis(id) {
  deballer(await supabase.from('devis').delete().eq('id_devis', id))
}

/* ---------- Commandes ---------- */

const SELECT_COMMANDE =
  '*, devis(id_devis, prix_unitaire, delai_livraison, date_devis, fournisseur(id_fournisseur, raison_sociale, telephone, email), produit(id_produit, code, designation, unite)), facture_fournisseur(*)'

/** Date de livraison prévue = date de commande + délai du devis */
export function datePrevue(commande) {
  const date = new Date(`${commande.date_commande}T00:00:00`)
  date.setDate(date.getDate() + Number(commande.devis?.delai_livraison ?? 0))
  return date
}

/** Nombre de jours entre aujourd'hui et la livraison prévue (négatif = retard) */
export function joursAvantLivraison(commande) {
  const aujourdHui = new Date()
  aujourdHui.setHours(0, 0, 0, 0)
  return Math.round((datePrevue(commande) - aujourdHui) / 86_400_000)
}

function enrichirCommande(c) {
  const facture = Array.isArray(c.facture_fournisseur) ? c.facture_fournisseur[0] : c.facture_fournisseur
  return {
    ...c,
    facture: facture ?? null,
    montant: Number(c.quantite) * Number(c.devis?.prix_unitaire ?? 0),
    date_prevue: datePrevue(c),
    jours_restants: c.etat === 'EN_ATTENTE' ? joursAvantLivraison(c) : null,
  }
}

export async function listerCommandes({ etat } = {}) {
  let requete = supabase.from('commande_fournisseur').select(SELECT_COMMANDE).order('date_commande', { ascending: false }).order('id_commande', { ascending: false })
  if (etat) requete = requete.eq('etat', etat)
  return deballer(await requete).map(enrichirCommande)
}

export async function lireCommande(id) {
  return enrichirCommande(deballer(await supabase.from('commande_fournisseur').select(SELECT_COMMANDE).eq('id_commande', id).single()))
}

/** Commandes en retard (vue v_commandes_retard) */
export async function listerRetards() {
  return deballer(await supabase.from('v_commandes_retard').select('*').order('jours_retard', { ascending: false }))
}

/** Passe une commande à partir d'un devis → id de la commande créée */
export async function passerCommande(idDevis, quantite) {
  return appelerRpc(supabase, 'passer_commande', { p_id_devis: idDevis, p_quantite: Number(quantite) })
}

export async function annulerCommande(id) {
  return appelerRpc(supabase, 'annuler_commande', { p_id_commande: id })
}

/* ---------- Factures fournisseur ---------- */

export async function listerFacturesFournisseur() {
  return deballer(
    await supabase
      .from('facture_fournisseur')
      .select('*, commande_fournisseur(id_commande, date_commande, quantite, devis(prix_unitaire, fournisseur(id_fournisseur, raison_sociale), produit(id_produit, code, designation, unite)))')
      .order('date_facture', { ascending: false })
      .order('id_facture_f', { ascending: false }),
  )
}

/**
 * Saisie contrôlée d'une facture fournisseur.
 * → { conforme: true, id_facture, nouveau_stock } ou { conforme: false, ecarts: [{ champ, attendu, saisi }] }
 */
export async function saisirFactureFournisseur({ idCommande, numero, date, quantite, prixUnitaire, montantTotal }) {
  return appelerRpc(supabase, 'saisir_facture_fournisseur', {
    p_id_commande: idCommande,
    p_numero: numero.trim(),
    p_date: date,
    p_quantite: Number(quantite),
    p_prix_unitaire: Number(prixUnitaire),
    p_montant_total: Number(montantTotal),
  })
}

/** Dernier prix d'achat connu par matière première (facture la plus récente, sinon meilleur devis) */
export async function prixAchatParMP() {
  const [factures, devis] = await Promise.all([
    supabase.from('facture_fournisseur').select('prix_unitaire, date_facture, commande_fournisseur(devis(id_produit))').order('date_facture', { ascending: false }),
    supabase.from('devis').select('id_produit, prix_unitaire'),
  ])
  const prix = {}
  for (const d of deballer(devis)) {
    if (prix[d.id_produit] === undefined || d.prix_unitaire < prix[d.id_produit]) prix[d.id_produit] = Number(d.prix_unitaire)
  }
  const factures_vues = new Set()
  for (const f of deballer(factures)) {
    const id = f.commande_fournisseur?.devis?.id_produit
    if (id && !factures_vues.has(id)) {
      prix[id] = Number(f.prix_unitaire)
      factures_vues.add(id)
    }
  }
  return prix
}
