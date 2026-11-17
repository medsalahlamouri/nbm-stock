/*
 * Routes de l'application (docs/ECRANS.md §D).
 * - Chaque page est chargée à la demande (React.lazy) : le premier affichage reste léger.
 * - `handle.fil` décrit le fil d'Ariane de l'en-tête.
 * - Gardes : connexion obligatoire, puis profil GERANT ou CHEF_MAGASIN selon la branche.
 */
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { RedirectionAccueil, RouteProfil, RouteProtegee, RoutePublique } from '@/components/layout/Gardes'
import { PageErreur, PageIntrouvable } from '@/pages/erreurs/PagesErreur'

// Accès
const Connexion = lazy(() => import('@/pages/auth/Connexion'))
const ChangerMotDePasse = lazy(() => import('@/pages/auth/ChangerMotDePasse'))
const FactureImprimable = lazy(() => import('@/pages/chef/FactureImprimable'))

// Commun
const MonCompte = lazy(() => import('@/pages/commun/MonCompte'))
const MonActivite = lazy(() => import('@/pages/commun/MonActivite'))

// Gérant
const TableauDeBordGerant = lazy(() => import('@/pages/gerant/TableauDeBord'))
const StockMatieres = lazy(() => import('@/pages/gerant/StockMatieres'))
const StockArticles = lazy(() => import('@/pages/gerant/StockArticles'))
const Fournisseurs = lazy(() => import('@/pages/gerant/Fournisseurs'))
const FournisseurFiche = lazy(() => import('@/pages/gerant/FournisseurFiche'))
const FournisseurFormulaire = lazy(() => import('@/pages/gerant/FournisseurFormulaire'))
const Devis = lazy(() => import('@/pages/gerant/Devis'))
const DevisFormulaire = lazy(() => import('@/pages/gerant/DevisFormulaire'))
const Commander = lazy(() => import('@/pages/gerant/Commander'))
const Commandes = lazy(() => import('@/pages/gerant/Commandes'))
const CommandeDetail = lazy(() => import('@/pages/gerant/CommandeDetail'))
const Parametres = lazy(() => import('@/pages/gerant/Parametres'))
const Calcul = lazy(() => import('@/pages/gerant/Calcul'))
const Statistiques = lazy(() => import('@/pages/gerant/Statistiques'))
const Utilisateurs = lazy(() => import('@/pages/gerant/Utilisateurs'))
const UtilisateurFiche = lazy(() => import('@/pages/gerant/UtilisateurFiche'))
const UtilisateurFormulaire = lazy(() => import('@/pages/gerant/UtilisateurFormulaire'))
const ActiviteChefs = lazy(() => import('@/pages/gerant/ActiviteChefs'))
const Sauvegarde = lazy(() => import('@/pages/gerant/Sauvegarde'))

// Chef magasin
const TableauDeBordChef = lazy(() => import('@/pages/chef/TableauDeBord'))
const Produits = lazy(() => import('@/pages/chef/Produits'))
const ProduitFiche = lazy(() => import('@/pages/chef/ProduitFiche'))
const ProduitFormulaire = lazy(() => import('@/pages/chef/ProduitFormulaire'))
const Mouvements = lazy(() => import('@/pages/chef/Mouvements'))
const MouvementFormulaire = lazy(() => import('@/pages/chef/MouvementFormulaire'))
const Inventaire = lazy(() => import('@/pages/chef/Inventaire'))
const FacturesFournisseur = lazy(() => import('@/pages/chef/FacturesFournisseur'))
const FactureFournisseurFormulaire = lazy(() => import('@/pages/chef/FactureFournisseurFormulaire'))
const Clients = lazy(() => import('@/pages/chef/Clients'))
const Demandes = lazy(() => import('@/pages/chef/Demandes'))
const DemandeFormulaire = lazy(() => import('@/pages/chef/DemandeFormulaire'))
const FacturesClient = lazy(() => import('@/pages/chef/FacturesClient'))
const FactureClientFormulaire = lazy(() => import('@/pages/chef/FactureClientFormulaire'))

const fil = (...elements) => ({ fil: elements })
const G = '/gerant'
const C = '/chef'

export const router = createBrowserRouter([
  {
    errorElement: <PageErreur />,
    children: [
      { path: '/', element: <RedirectionAccueil /> },
      {
        element: <RoutePublique />,
        children: [{ path: '/connexion', element: <Connexion /> }],
      },
      {
        element: <RouteProtegee />,
        children: [
          { path: '/changer-mot-de-passe', element: <ChangerMotDePasse /> },

          /* ---------- Gérant ---------- */
          {
            path: G,
            element: <RouteProfil profil="GERANT" />,
            children: [
              {
                element: <AppShell />,
                children: [
                  { index: true, element: <TableauDeBordGerant />, handle: fil({ libelle: 'Accueil', to: G }, 'Tableau de bord') },
                  { path: 'stock/matieres', element: <StockMatieres />, handle: fil('Stock', 'Matières premières') },
                  { path: 'stock/articles', element: <StockArticles />, handle: fil('Stock', 'Articles') },
                  { path: 'fournisseurs', element: <Fournisseurs />, handle: fil('Achats', 'Fournisseurs') },
                  { path: 'fournisseurs/nouveau', element: <FournisseurFormulaire />, handle: fil('Achats', { libelle: 'Fournisseurs', to: `${G}/fournisseurs` }, 'Nouveau') },
                  { path: 'fournisseurs/:id', element: <FournisseurFiche />, handle: fil('Achats', { libelle: 'Fournisseurs', to: `${G}/fournisseurs` }, 'Fiche') },
                  { path: 'fournisseurs/:id/modifier', element: <FournisseurFormulaire />, handle: fil('Achats', { libelle: 'Fournisseurs', to: `${G}/fournisseurs` }, 'Modifier') },
                  { path: 'devis', element: <Devis />, handle: fil('Achats', 'Devis') },
                  { path: 'devis/nouveau', element: <DevisFormulaire />, handle: fil('Achats', { libelle: 'Devis', to: `${G}/devis` }, 'Nouveau') },
                  { path: 'devis/:id/modifier', element: <DevisFormulaire />, handle: fil('Achats', { libelle: 'Devis', to: `${G}/devis` }, 'Modifier') },
                  { path: 'commander', element: <Commander />, handle: fil('Achats', 'Comparer et commander') },
                  { path: 'commandes', element: <Commandes />, handle: fil('Achats', 'Commandes') },
                  { path: 'commandes/:id', element: <CommandeDetail />, handle: fil('Achats', { libelle: 'Commandes', to: `${G}/commandes` }, 'Détail') },
                  { path: 'parametres', element: <Parametres />, handle: fil('Statistiques', 'Paramètres de calcul') },
                  { path: 'calcul', element: <Calcul />, handle: fil('Statistiques', 'Quantité à commander') },
                  { path: 'statistiques', element: <Statistiques />, handle: fil('Statistiques', 'Statistiques') },
                  { path: 'utilisateurs', element: <Utilisateurs />, handle: fil('Administration', 'Utilisateurs') },
                  { path: 'utilisateurs/nouveau', element: <UtilisateurFormulaire />, handle: fil('Administration', { libelle: 'Utilisateurs', to: `${G}/utilisateurs` }, 'Nouveau chef magasin') },
                  { path: 'utilisateurs/:id', element: <UtilisateurFiche />, handle: fil('Administration', { libelle: 'Utilisateurs', to: `${G}/utilisateurs` }, 'Fiche') },
                  { path: 'utilisateurs/:id/modifier', element: <UtilisateurFormulaire />, handle: fil('Administration', { libelle: 'Utilisateurs', to: `${G}/utilisateurs` }, 'Modifier') },
                  { path: 'activite-chefs', element: <ActiviteChefs />, handle: fil('Administration', 'Activité des chefs') },
                  { path: 'sauvegarde', element: <Sauvegarde />, handle: fil('Administration', 'Sauvegarde') },
                  { path: 'compte', element: <MonCompte />, handle: fil('Compte', 'Mon compte') },
                  { path: 'activite', element: <MonActivite />, handle: fil('Administration', 'Mon activité') },
                  { path: '*', element: <PageIntrouvable /> },
                ],
              },
            ],
          },

          /* ---------- Chef magasin ---------- */
          {
            path: C,
            element: <RouteProfil profil="CHEF_MAGASIN" />,
            children: [
              // Facture imprimable : page A4 sans menu
              { path: 'factures-client/:id/imprimer', element: <FactureImprimable /> },
              {
                element: <AppShell />,
                children: [
                  { index: true, element: <TableauDeBordChef />, handle: fil({ libelle: 'Accueil', to: C }, 'Tableau de bord') },
                  { path: 'produits', element: <Produits />, handle: fil('Stock', 'Produits') },
                  { path: 'produits/nouveau', element: <ProduitFormulaire />, handle: fil('Stock', { libelle: 'Produits', to: `${C}/produits` }, 'Nouveau') },
                  { path: 'produits/:id', element: <ProduitFiche />, handle: fil('Stock', { libelle: 'Produits', to: `${C}/produits` }, 'Fiche') },
                  { path: 'produits/:id/modifier', element: <ProduitFormulaire />, handle: fil('Stock', { libelle: 'Produits', to: `${C}/produits` }, 'Modifier') },
                  { path: 'mouvements', element: <Mouvements />, handle: fil('Stock', 'Mouvements') },
                  { path: 'mouvements/nouveau', element: <MouvementFormulaire />, handle: fil('Stock', { libelle: 'Mouvements', to: `${C}/mouvements` }, 'Nouveau') },
                  { path: 'inventaire', element: <Inventaire />, handle: fil('Stock', 'Inventaire') },
                  { path: 'factures-fournisseur', element: <FacturesFournisseur />, handle: fil('Achats', 'Factures fournisseur') },
                  { path: 'factures-fournisseur/nouvelle', element: <FactureFournisseurFormulaire />, handle: fil('Achats', { libelle: 'Factures fournisseur', to: `${C}/factures-fournisseur` }, 'Saisir') },
                  { path: 'clients', element: <Clients />, handle: fil('Ventes', 'Clients') },
                  { path: 'demandes', element: <Demandes />, handle: fil('Ventes', 'Demandes') },
                  { path: 'demandes/nouvelle', element: <DemandeFormulaire />, handle: fil('Ventes', { libelle: 'Demandes', to: `${C}/demandes` }, 'Nouvelle') },
                  { path: 'demandes/:id/modifier', element: <DemandeFormulaire />, handle: fil('Ventes', { libelle: 'Demandes', to: `${C}/demandes` }, 'Modifier') },
                  { path: 'factures-client', element: <FacturesClient />, handle: fil('Ventes', 'Factures client') },
                  { path: 'factures-client/nouvelle', element: <FactureClientFormulaire />, handle: fil('Ventes', { libelle: 'Factures client', to: `${C}/factures-client` }, 'Établir') },
                  { path: 'compte', element: <MonCompte />, handle: fil('Compte', 'Mon compte') },
                  { path: 'activite', element: <MonActivite />, handle: fil('Compte', 'Mon activité') },
                  { path: '*', element: <PageIntrouvable /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <PageIntrouvable /> },
    ],
  },
])
