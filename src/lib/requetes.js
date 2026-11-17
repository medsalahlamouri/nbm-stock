/*
 * Outils communs aux appels Supabase.
 */
import { QueryClient } from '@tanstack/react-query'
import { deballer, ErreurApplication } from '@/lib/erreurs'

/**
 * Client TanStack Query de l'application :
 * - données considérées fraîches 30 s (évite les rechargements inutiles en naviguant) ;
 * - rechargement automatique au retour sur l'onglet du navigateur ;
 * - une seule nouvelle tentative en cas d'échec réseau, aucune pour les erreurs métier.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (nombre, erreur) => !(erreur instanceof ErreurApplication) && nombre < 1,
    },
    mutations: {
      retry: false,
    },
  },
})

/** Fréquence de rafraîchissement des tableaux de bord et des compteurs du menu */
export const RAFRAICHISSEMENT_PERIODIQUE = 60_000

/**
 * Lit toutes les lignes d'une requête, par paquets de 1 000
 * (l'API de données de Supabase plafonne chaque réponse à 1 000 lignes).
 * @param {() => import('@supabase/postgrest-js').PostgrestFilterBuilder} construire fabrique la requête
 */
export async function toutLire(construire, taille = 1000) {
  const lignes = []
  for (let debut = 0; ; debut += taille) {
    const paquet = deballer(await construire().range(debut, debut + taille - 1))
    lignes.push(...paquet)
    if (paquet.length < taille) break
  }
  return lignes
}

/** Appelle une fonction RPC et renvoie son résultat (les erreurs du serveur sont déjà en français) */
export async function appelerRpc(supabase, nom, parametres) {
  const resultat = deballer(await supabase.rpc(nom, parametres))
  // Une fonction qui renvoie un objet JSON peut arriver sous forme de tableau d'une ligne
  return Array.isArray(resultat) && resultat.length === 1 && typeof resultat[0] === 'object' ? resultat[0] : resultat
}

/**
 * Domaines de données → préfixes de clés TanStack Query à invalider après une action.
 * Chaque mutation déclare les domaines qu'elle modifie ; tout ce qui en dépend est relu.
 */
const DOMAINES = {
  stock: [['etat-stock'], ['produits'], ['produit'], ['mouvements'], ['courbe-stock'], ['simulation']],
  achats: [['fournisseurs'], ['fournisseur'], ['devis'], ['commandes'], ['commande'], ['retards'], ['evaluation']],
  receptions: [['factures-fournisseur'], ['commandes'], ['commande'], ['retards'], ['evaluation']],
  ventes: [['clients'], ['demandes'], ['demande'], ['factures-client'], ['facture-client']],
  comptes: [['utilisateurs'], ['utilisateur'], ['moi']],
  statistiques: [['statistiques'], ['abc']],
}

export function invalider(...domaines) {
  const cles = new Set()
  for (const domaine of domaines) for (const cle of DOMAINES[domaine] ?? [[domaine]]) cles.add(JSON.stringify(cle))
  // Tableaux de bord, compteurs du menu, alertes et journal dépendent de presque tout
  for (const cle of [['tableau-de-bord'], ['compteurs'], ['alertes'], ['journal'], ['statistiques']]) cles.add(JSON.stringify(cle))
  return Promise.all([...cles].map((cle) => queryClient.invalidateQueries({ queryKey: JSON.parse(cle) })))
}
