/*
 * Menus latéraux du gérant et du chef magasin (docs/DESIGN.md §3).
 * `compteur` désigne le compteur affiché à droite du lien (voir useCompteursMenu) :
 * rouge pour les retards (gérant), doré pour les éléments à traiter (chef).
 */
import {
  Armchair,
  ArrowLeftRight,
  Calculator,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Database,
  FileText,
  History,
  Inbox,
  Layers,
  LayoutGrid,
  Package,
  Receipt,
  Scale,
  SlidersHorizontal,
  Truck,
  Users,
} from 'lucide-react'

export const MENU_GERANT = [
  { liens: [{ libelle: 'Tableau de bord', to: '/gerant', icone: LayoutGrid, exact: true }] },
  {
    titre: 'Stock',
    liens: [
      { libelle: 'Matières premières', to: '/gerant/stock/matieres', icone: Layers },
      { libelle: 'Articles', to: '/gerant/stock/articles', icone: Armchair },
    ],
  },
  {
    titre: 'Achats',
    liens: [
      { libelle: 'Fournisseurs', to: '/gerant/fournisseurs', icone: Truck },
      { libelle: 'Devis', to: '/gerant/devis', icone: FileText },
      { libelle: 'Comparer et commander', to: '/gerant/commander', icone: Scale },
      {
        libelle: 'Commandes',
        to: '/gerant/commandes',
        icone: ClipboardList,
        compteur: 'retards',
        ton: 'rouge',
      },
    ],
  },
  {
    titre: 'Statistiques',
    liens: [
      { libelle: 'Paramètres de calcul', to: '/gerant/parametres', icone: SlidersHorizontal },
      { libelle: 'Quantité à commander', to: '/gerant/calcul', icone: Calculator },
      { libelle: 'Statistiques', to: '/gerant/statistiques', icone: ChartColumn },
    ],
  },
  {
    titre: 'Administration',
    liens: [
      { libelle: 'Utilisateurs', to: '/gerant/utilisateurs', icone: Users },
      { libelle: 'Activité des chefs', to: '/gerant/activite-chefs', icone: Clock },
      { libelle: 'Sauvegarde', to: '/gerant/sauvegarde', icone: Database },
      { libelle: 'Mon activité', to: '/gerant/activite', icone: History },
    ],
  },
]

export const MENU_CHEF = [
  { liens: [{ libelle: 'Tableau de bord', to: '/chef', icone: LayoutGrid, exact: true }] },
  {
    titre: 'Stock',
    liens: [
      { libelle: 'Produits', to: '/chef/produits', icone: Package },
      { libelle: 'Mouvements', to: '/chef/mouvements', icone: ArrowLeftRight },
      { libelle: 'Inventaire', to: '/chef/inventaire', icone: ClipboardCheck },
    ],
  },
  {
    titre: 'Achats',
    liens: [
      {
        libelle: 'Factures fournisseur',
        to: '/chef/factures-fournisseur',
        icone: Inbox,
        compteur: 'aReceptionner',
        ton: 'or',
      },
    ],
  },
  {
    titre: 'Ventes',
    liens: [
      { libelle: 'Clients', to: '/chef/clients', icone: Users },
      {
        libelle: 'Demandes',
        to: '/chef/demandes',
        icone: FileText,
        compteur: 'demandesEnAttente',
        ton: 'or',
      },
      { libelle: 'Factures client', to: '/chef/factures-client', icone: Receipt },
    ],
  },
  { titre: 'Compte', liens: [{ libelle: 'Mon activité', to: '/chef/activite', icone: History }] },
]
