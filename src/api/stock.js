/*
 * Stock — produits, état du stock (vue v_etat_stock), mouvements, inventaire, paramètres de calcul.
 * Règle : le stock ne s'écrit jamais directement, uniquement par les fonctions RPC.
 */
import { supabase } from '@/lib/supabase'
import { deballer } from '@/lib/erreurs'
import { appelerRpc, toutLire } from '@/lib/requetes'

/* ---------- Lectures ---------- */

/** État du stock de tous les produits (MP et articles) : seuil, Q*, couverture, alerte, état */
export async function listerEtatStock() {
  return deballer(await supabase.from('v_etat_stock').select('*').order('code'))
}

/** Fiche complète d'un produit (table produit, avec paramètres de calcul) */
export async function lireProduit(id) {
  return deballer(await supabase.from('produit').select('*').eq('id_produit', id).single())
}

/** Tous les produits (table) : utile pour les paramètres de calcul et les listes de choix */
export async function listerProduits() {
  return deballer(await supabase.from('produit').select('*').order('code'))
}

/**
 * Historique des mouvements d'un produit, du plus récent au plus ancien,
 * avec la colonne « stock après » reconstituée à partir du stock actuel (extension UC15).
 */
export async function historiqueProduit(idProduit, stockActuel) {
  const mouvements = await toutLire(() =>
    supabase
      .from('mouvement_stock')
      .select('id_mouvement, date_mouvement, type, quantite, motif, id_utilisateur, utilisateur(nom, prenom)')
      .eq('id_produit', idProduit)
      .order('date_mouvement', { ascending: false })
      .order('id_mouvement', { ascending: false }),
  )
  let stock = Number(stockActuel ?? 0)
  return mouvements.map((m) => {
    const ligne = { ...m, stock_apres: stock }
    stock -= m.type === 'ENTREE' ? m.quantite : -m.quantite
    return ligne
  })
}

/**
 * Série pour la courbe d'évolution du stock : un point par jour sur la période,
 * stock en fin de journée (reconstitué en remontant les mouvements depuis le stock actuel).
 */
export function serieStock(historique, stockActuel, jours = 90, pas = 1) {
  const fin = new Date()
  fin.setHours(23, 59, 59, 999)
  const points = []
  let stock = Number(stockActuel ?? 0)
  let index = 0
  for (let j = 0; j < jours; j += pas) {
    const jour = new Date(fin)
    jour.setDate(fin.getDate() - j)
    // Annule les mouvements postérieurs à la fin de ce jour pour obtenir le stock à cette date
    while (index < historique.length && new Date(historique[index].date_mouvement) > jour) {
      const m = historique[index]
      stock -= m.type === 'ENTREE' ? m.quantite : -m.quantite
      index += 1
    }
    points.push({ date: new Date(jour.getFullYear(), jour.getMonth(), jour.getDate()).toISOString(), stock })
  }
  return points.reverse()
}

/* ---------- Écritures (chef magasin) ---------- */

/** Crée un produit et son mouvement « Stock initial » → id du produit */
export async function creerProduit({ code, designation, type, unite, stockInitial, prixVente, seuilMinimum }) {
  return appelerRpc(supabase, 'creer_produit', {
    p_code: code.trim(),
    p_designation: designation.trim(),
    p_type: type,
    p_unite: unite.trim(),
    p_stock_initial: Number(stockInitial ?? 0),
    p_prix_vente: type === 'ARTICLE' ? Number(prixVente) : null,
    p_seuil_minimum: type === 'ARTICLE' ? Number(seuilMinimum) : null,
  })
}

/** Modifie désignation, unité, prix de vente et seuil (jamais le stock, le type ni les paramètres) */
export async function modifierProduit(id, { designation, unite, prixVente, seuilMinimum, type }) {
  const donnees = { designation: designation.trim(), unite: unite.trim() }
  if (type === 'ARTICLE') {
    donnees.prix_vente = Number(prixVente)
    donnees.seuil_minimum = Number(seuilMinimum)
  }
  return deballer(await supabase.from('produit').update(donnees).eq('id_produit', id).select('*').single())
}

/** Mouvement manuel : MP → sortie « Consommation atelier », article → entrée « Production atelier » */
export async function enregistrerMouvement(idProduit, quantite) {
  return appelerRpc(supabase, 'enregistrer_mouvement', { p_id_produit: idProduit, p_quantite: Number(quantite) })
}

/** Inventaire : lignes [{ id_produit, quantite_comptee }] → { ajustements } */
export async function enregistrerInventaire(lignes) {
  return appelerRpc(supabase, 'enregistrer_inventaire', { p_lignes: lignes })
}

/* ---------- Paramètres de calcul (gérant) ---------- */

/** Met à jour S, H, L, j et la période ; Q* et PC sont recalculés par le serveur */
export async function modifierParametres(id, { coutCommande, coutDetention, delaiLivraison, joursSecurite, periodeAnalyse }) {
  return deballer(
    await supabase
      .from('produit')
      .update({
        cout_commande: Number(coutCommande),
        cout_detention: Number(coutDetention),
        delai_livraison: Number(delaiLivraison),
        jours_securite: Number(joursSecurite),
        periode_analyse: Number(periodeAnalyse),
      })
      .eq('id_produit', id)
      .select('*')
      .single(),
  )
}

/** Détail du calcul de Q* et du PC (sans enregistrement) */
export async function simulerCalcul(idProduit, periode) {
  return appelerRpc(supabase, 'simuler_calcul', {
    p_id_produit: idProduit,
    ...(periode ? { p_periode: Number(periode) } : {}),
  })
}

/* ---------- Référentiels : suppression / désactivation / réactivation ---------- */

/**
 * Supprime l'élément s'il n'a aucune donnée liée, sinon le désactive.
 * @param {'fournisseur'|'client'|'produit'} objet
 * @returns {'SUPPRIME'|'DESACTIVE'}
 */
export async function supprimerOuDesactiver(objet, id) {
  const resultat = await appelerRpc(supabase, 'supprimer_ou_desactiver', { p_objet: objet, p_id: id })
  return typeof resultat === 'string' ? resultat : Object.values(resultat ?? {})[0]
}

const CLES = { fournisseur: 'id_fournisseur', client: 'id_client', produit: 'id_produit' }

/** Réactivation : update ... set actif = true (autorisé par BACKEND.md §5) */
export async function reactiver(objet, id) {
  return deballer(await supabase.from(objet).update({ actif: true }).eq(CLES[objet], id).select().single())
}
