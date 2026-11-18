# Conventions de développement — NBM Stock

Application web de gestion de stock de la société **Nabeul Bois et Meubles (NBM)**, fabricant de meubles en bois.
Deux profils : **Gérant** (compte unique) et **Chef magasin**. Le back-end est hébergé sur Supabase ;
ce dépôt contient uniquement la front-end React.

Toutes les interfaces, tous les messages et tous les commentaires de code sont **en français**.

---

## 1. Documents de référence

| Fichier | Contenu |
|---|---|
| `docs/BACKEND.md` | Contrat Supabase : tables, vues, fonctions RPC (paramètres et retours), Edge Functions, Storage, droits par profil |
| `docs/DESIGN.md` | Système visuel : couleurs (thème clair et sombre), typographie, composants, logo |
| `docs/ECRANS.md` | Les 46 écrans : route, profil, contenu, actions, source de données ; écarts retenus avec la maquette |

En cas de doute : **`docs/DESIGN.md` fait foi pour le visuel**, **`docs/BACKEND.md` pour les données et les règles**.

---

## 2. Pile technique

- **Vite** + **React** en **JavaScript** (`.jsx`).
- **React Router** (routes imbriquées, gardes par profil).
- **Tailwind CSS** + **shadcn/ui** en mode JavaScript (`"tsx": false` dans `components.json`), thème
  personnalisé avec les variables CSS de `docs/DESIGN.md` (clair et sombre).
- **@supabase/supabase-js** v2 : seul moyen d'accès au back-end.
- **TanStack Query** pour toutes les lectures et mutations (cache, états de chargement, invalidation).
- **react-hook-form** + **zod** pour les formulaires et les contrôles de saisie.
- **Recharts** (graphiques), **Motion** (animations), **lucide-react** (icônes), **sonner** (notifications),
  **date-fns** (dates, locale `fr`), **jspdf** + **jspdf-autotable** (PDF), **exceljs** (Excel).
- Polices : **Fraunces** (titres) et **Inter** (texte).

Le code repris de shadcn/ui (licence MIT) conserve sa mention de licence.

---

## 3. Structure du projet

```
src/
  main.jsx, App.jsx            point d'entrée, fournisseurs (thème, cache, session, routeur)
  routes.jsx                   routes, chargement différé des pages, gardes, fil d'Ariane
  config/supabase.js           URL du projet et clé publishable (valeurs publiques)
  config/entreprise.js         identité de NBM imprimée sur les factures client
  lib/supabase.js              client Supabase unique
  lib/format.js                montants DT, nombres, dates fr-FR, téléphone, références, montant en lettres
  lib/erreurs.js               traduction des erreurs Supabase / Edge Functions en messages clairs
  lib/requetes.js              client TanStack Query, lecture par paquets de 1 000 lignes, invalidation par domaine
  lib/etats.js, schemas.js     états du back-end → badges ; règles de saisie zod partagées
  lib/periodes.js, exports.js  périodes d'analyse ; exports PDF / Excel (chargés à la demande)
  api/                         une fonction par appel Supabase, regroupées par domaine
  hooks/                       session, lectures partagées, compteurs du menu, suppression, comptes
  components/ui/               composants shadcn/ui adaptés à la maquette
  components/layout/           AppShell, menu latéral, en-tête, fil d'Ariane, thème, alertes, gardes
  components/commun/           DataTable, Combobox, Onglets, StatCard, Badge, graphiques, journal, formulaires…
  pages/auth/                  connexion, mot de passe provisoire
  pages/commun/                Mon compte, Mon activité
  pages/gerant/                écrans du gérant
  pages/chef/                  écrans du chef magasin
  pages/erreurs/               pages 404 et erreur
docs/                          documents de référence (conventions, back-end, design, écrans)
```

Le dépôt ne contient que la front-end : aucun serveur, aucune migration, aucune Edge Function.

---

## 4. Règles

### Sécurité et back-end
1. Le back-end (tables, fonctions, politiques RLS, Edge Functions) n'est pas modifié depuis ce dépôt.
2. Le front n'utilise que l'**URL du projet** et la **clé publishable** (`src/config/supabase.js`), publiques
   par conception : la sécurité repose sur Supabase Auth et la RLS. Aucun fichier `.env`, jamais de clé `service_role`.
3. Toute opération qui touche au **stock ou aux documents** passe par une **fonction RPC** (`supabase.rpc`) :
   jamais d'écriture directe sur `mouvement_stock`, `commande_fournisseur`, `facture_*`, `demande_client`,
   `ligne_demande`, ni sur `produit.quantite_stock`.
4. L'administration des comptes et la sauvegarde passent par les Edge Functions `gerer-comptes`
   et `sauvegarder-donnees` (`supabase.functions.invoke`).
5. La sécurité est assurée par la RLS côté serveur. Le front masque ce qu'un profil ne peut pas faire,
   sans jamais s'en remettre à ce masquage.

### Comportement
6. Aucune donnée fictive dans le code : tout vient de Supabase.
7. Après connexion : `enregistrer_connexion()`. En cas d'échec (compte désactivé) : `signOut()` et message.
   Si `doit_changer_mdp` : redirection forcée vers `/changer-mot-de-passe`.
8. Les messages d'erreur des RPC (en français) sont affichés tels quels. Les retours `{ ok: false, manquants }`
   et `{ conforme: false, ecarts }` ne sont pas des erreurs : ils sont détaillés dans l'écran.
9. Après chaque mutation, les requêtes TanStack Query concernées sont invalidées.
10. Confirmation (`AlertDialog`) avant toute suppression, désactivation, annulation ou validation d'inventaire.
11. Supprimer un élément passe par `supprimer_ou_desactiver`, dont le résultat est annoncé
    (« supprimé » ou « désactivé car il a des données liées »).

### Interface
12. Fidélité à la maquette : disposition, espacements, couleurs, badges, textes des boutons.
13. Filtres : liste longue (produits, fournisseurs, clients) → combobox ; peu de choix (état, motif, type, canal,
    statut) → onglets ; peu d'éléments en attente → cartes cliquables.
14. Tableaux paginés par 10 lignes (« lignes 1 à 10 sur N », pages numérotées).
15. Chaque écran gère quatre états : chargement (squelettes), vide (message + action), erreur, données.
16. Thème clair / sombre avec bouton dans l'en-tête (choix mémorisé dans `localStorage`).
17. Ordinateur et tablette (menu latéral coulissant sous 1024 px).
18. Accessibilité : libellés de champs, `aria-label` sur les boutons-icônes, focus visible, contraste.
19. Formats : montants `1 234,500 DT` (3 décimales) dans les documents, arrondis dans les indicateurs ;
    dates `13/11/2026` ; téléphone tunisien à 8 chiffres.

---

## 5. Commandes

Poste de développement : Windows 11, VS Code, terminal PowerShell.

```powershell
npm install          # dépendances
npm run dev          # serveur de développement (http://localhost:5173)
npm run build        # build de production
npm run lint         # vérification du code (oxlint)
npm run format       # mise en forme (Prettier)
```

## 6. Comptes de test

- Gérant : `gerant@gmail.com`
- Chef magasin : `chef@gmail.com`

Les mots de passe ne figurent dans aucun fichier du dépôt.
