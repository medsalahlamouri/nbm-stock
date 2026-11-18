/*
 * Compteurs du menu latéral et alertes de l'en-tête, rafraîchis toutes les minutes.
 * - Gérant : commandes en retard (v_commandes_retard), produits en alerte.
 * - Chef : commandes à réceptionner (EN_ATTENTE), demandes en attente, produits en alerte.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { deballer } from '@/lib/erreurs'
import { RAFRAICHISSEMENT_PERIODIQUE } from '@/lib/requetes'

async function compter(table, colonne, valeur) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(colonne, valeur)
  deballer({ data: null, error })
  return count ?? 0
}

async function lireCompteurs(profil) {
  if (profil === 'GERANT') {
    const retards = await supabase
      .from('v_commandes_retard')
      .select('id_commande', { count: 'exact', head: true })
    deballer({ data: null, error: retards.error })
    return { retards: retards.count ?? 0 }
  }
  const [aReceptionner, demandesEnAttente] = await Promise.all([
    compter('commande_fournisseur', 'etat', 'EN_ATTENTE'),
    compter('demande_client', 'etat', 'EN_ATTENTE'),
  ])
  return { aReceptionner, demandesEnAttente }
}

export function useCompteursMenu(profil) {
  return useQuery({
    queryKey: ['compteurs', profil],
    queryFn: () => lireCompteurs(profil),
    enabled: Boolean(profil),
    refetchInterval: RAFRAICHISSEMENT_PERIODIQUE,
  })
}

/** Alertes de l'en-tête (cloche) */
async function lireAlertes(profil) {
  const [stock, retards, aReceptionner] = await Promise.all([
    supabase
      .from('v_etat_stock')
      .select('id_produit, code, designation, type, unite, quantite_stock, seuil, etat')
      .eq('en_alerte', true)
      .eq('actif', true)
      .order('type')
      .order('quantite_stock'),
    profil === 'GERANT'
      ? supabase.from('v_commandes_retard').select('*').order('jours_retard', { ascending: false })
      : { data: [], error: null },
    profil === 'CHEF_MAGASIN'
      ? supabase
          .from('commande_fournisseur')
          .select(
            'id_commande, date_commande, quantite, devis(delai_livraison, fournisseur(raison_sociale), produit(designation))',
          )
          .eq('etat', 'EN_ATTENTE')
          .order('date_commande')
      : { data: [], error: null },
  ])
  return {
    stock: deballer(stock),
    retards: deballer(retards),
    aReceptionner: deballer(aReceptionner),
  }
}

export function useAlertes(profil) {
  return useQuery({
    queryKey: ['alertes', profil],
    queryFn: () => lireAlertes(profil),
    enabled: Boolean(profil),
    refetchInterval: RAFRAICHISSEMENT_PERIODIQUE,
  })
}
