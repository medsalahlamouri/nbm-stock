# NBM Stock — front-end React

Application web de gestion de stock de **Nabeul Bois et Meubles (NBM)**, fabricant de meubles en bois.
Deux profils : **Gérant** (achats, statistiques, administration) et **Chef magasin** (stock, réception, ventes).

Ce dépôt contient **uniquement la front-end**. Le back-end (base PostgreSQL, règles de sécurité RLS, fonctions RPC,
Edge Functions, stockage des photos) est hébergé sur **Supabase** et n'est jamais modifié depuis ce dépôt.

---

## Prérequis

| Outil | Version |
|---|---|
| Node.js | 20.19 ou plus récent (LTS conseillée) |
| npm | fourni avec Node.js |
| Navigateur | Chrome, Edge ou Firefox récent |

Poste de développement : Windows 11, VS Code, terminal PowerShell.

## Installation et démarrage

```powershell
npm install          # installe les dépendances
npm run dev          # serveur de développement → http://localhost:5173
```

Autres commandes :

```powershell
npm run build        # build de production dans dist/
npm run preview      # sert le build de production en local
npm run lint         # vérification du code (oxlint)
npm run format       # mise en forme (Prettier)
```

## Configuration Supabase

Aucun fichier `.env` : l'URL du projet et la **clé publishable** sont écrites dans `src/config/supabase.js`.
Ces deux valeurs sont publiques par conception ; la sécurité repose sur Supabase Auth (jeton de l'utilisateur
connecté) et sur les politiques RLS côté serveur. **La clé `service_role` n'est jamais utilisée.**

Les coordonnées de l'entreprise imprimées sur les factures client se règlent dans `src/config/entreprise.js`.

## Pile technique

Vite 8 · React 19 (JavaScript) · React Router 8 · TanStack Query 5 · Tailwind CSS 4 · shadcn/ui (mode JS, Radix) ·
Motion (animations) · react-hook-form + zod · Recharts · lucide-react · sonner · date-fns · jspdf / jspdf-autotable · exceljs.

## Structure

```
src/
  main.jsx, App.jsx        point d'entrée et fournisseurs (thème, cache, session, infobulles, animations, routeur)
  routes.jsx               toutes les routes, chargement différé des pages, gardes par profil, fil d'Ariane
  config/                  configuration publique Supabase, identité de l'entreprise
  lib/                     client Supabase, formatage (DT, dates, montant en lettres), erreurs, cache et
                           invalidation, états → badges, règles de saisie, périodes, exports PDF / Excel
  api/                     une fonction par appel Supabase (tables, vues, RPC, Edge Functions, Storage)
  hooks/                   session (useAuth), lectures partagées, compteurs du menu, suppression, comptes
  components/ui/           composants shadcn/ui adaptés à la maquette
  components/layout/       AppShell, menu latéral, en-tête, fil d'Ariane, thème, alertes, gardes
  components/commun/       DataTable, Combobox, Onglets, StatCard, Badge, graphiques, journal, états, formulaires…
  pages/auth/              connexion, mot de passe provisoire
  pages/commun/            Mon compte, Mon activité
  pages/gerant/            écrans du gérant (B1 à B14)
  pages/chef/              écrans du chef magasin (C1 à C10ter)
  pages/erreurs/           pages 404 et erreur
docs/                      contrat back-end, système visuel, fiches des écrans, maquette (captures + index)
```

## Principes

- **Stock et documents** : toute écriture passe par une fonction RPC (`supabase.rpc`). Écritures directes
  limitées à ce qu'autorise `docs/BACKEND.md` §6 (fournisseurs, devis, clients, paramètres et fiches produits,
  coordonnées des comptes).
- **Comptes et sauvegarde** : Edge Functions `gerer-comptes` et `sauvegarder-donnees`.
- **Données toujours à jour** : TanStack Query invalide les données concernées après chaque action, les relit au
  retour sur l'onglet et rafraîchit chaque minute les tableaux de bord, les compteurs du menu et les alertes.
- **Volumes** : lectures par paquets de 1 000 lignes et pagination côté serveur pour les mouvements.
- **Interface** : thème clair / sombre mémorisé, ordinateur et tablette (menu coulissant sous 1024 px),
  navigation au clavier, focus visible, animations courtes désactivées si le système demande moins d'animations.

## Comptes de test

- Gérant : `gerant.nbm@example.com`
- Chef magasin : `chef.nbm@example.com`

Les mots de passe ne figurent dans aucun fichier du dépôt.
