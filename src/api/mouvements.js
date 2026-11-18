/*
 * Mouvements de stock (lecture) — pagination côté serveur, le volume pouvant devenir important.
 */
import { supabase } from '@/lib/supabase'
import { deballer } from '@/lib/erreurs'
import { toutLire } from '@/lib/requetes'

export const MOTIFS = {
  'Stock initial': { sens: 'ENTREE', auto: false },
  'Réception fournisseur': { sens: 'ENTREE', auto: true },
  'Production atelier': { sens: 'ENTREE', auto: false },
  'Consommation atelier': { sens: 'SORTIE', auto: false },
  Vente: { sens: 'SORTIE', auto: true },
  Inventaire: { sens: 'LES_DEUX', auto: false },
}

/** Motifs proposés en filtre selon le type de produit */
export const MOTIFS_PAR_TYPE = {
  MP: ['Stock initial', 'Réception fournisseur', 'Consommation atelier', 'Inventaire'],
  ARTICLE: ['Stock initial', 'Production atelier', 'Vente', 'Inventaire'],
}

/**
 * Page de mouvements filtrée.
 * @returns {{ lignes: object[], total: number }}
 */
export async function listerMouvements({ type, idProduit, motif, depuis, page = 1, taille = 10 }) {
  let requete = supabase
    .from('mouvement_stock')
    .select(
      'id_mouvement, date_mouvement, type, quantite, motif, id_utilisateur, produit!inner(id_produit, code, designation, unite, type), utilisateur(nom, prenom)',
      { count: 'exact' },
    )
    .order('date_mouvement', { ascending: false })
    .order('id_mouvement', { ascending: false })
  if (type) requete = requete.eq('produit.type', type)
  if (idProduit) requete = requete.eq('id_produit', idProduit)
  if (motif) requete = requete.eq('motif', motif)
  if (depuis) requete = requete.gte('date_mouvement', depuis)
  const debut = (page - 1) * taille
  const { data, error, count } = await requete.range(debut, debut + taille - 1)
  deballer({ data, error })
  return { lignes: data, total: count ?? 0 }
}

/** Résumé des mouvements depuis une date : entrées, sorties, totaux par motif */
export async function resumerMouvements({ type, depuis }) {
  const lignes = await toutLire(() => {
    let requete = supabase
      .from('mouvement_stock')
      .select('type, quantite, motif, produit!inner(type)')
    if (type) requete = requete.eq('produit.type', type)
    if (depuis) requete = requete.gte('date_mouvement', depuis)
    return requete.order('id_mouvement')
  })
  const resume = {
    entrees: 0,
    sorties: 0,
    nbEntrees: 0,
    nbSorties: 0,
    parMotif: {},
    nombre: lignes.length,
  }
  for (const l of lignes) {
    if (l.type === 'ENTREE') {
      resume.entrees += l.quantite
      resume.nbEntrees += 1
    } else {
      resume.sorties += l.quantite
      resume.nbSorties += 1
    }
    const m = (resume.parMotif[l.motif] ??= { entrees: 0, sorties: 0, nombre: 0 })
    m.nombre += 1
    if (l.type === 'ENTREE') m.entrees += l.quantite
    else m.sorties += l.quantite
  }
  return resume
}

/** Derniers mouvements tous produits confondus (tableau de bord du chef) */
export async function derniersMouvements(nombre = 6) {
  return deballer(
    await supabase
      .from('mouvement_stock')
      .select(
        'id_mouvement, date_mouvement, type, quantite, motif, produit(id_produit, code, designation, unite, type)',
      )
      .order('date_mouvement', { ascending: false })
      .order('id_mouvement', { ascending: false })
      .limit(nombre),
  )
}
