# NBM Stock

Application web de gestion de stock de **Nabeul Bois et Meubles (NBM)**, fabricant de meubles en bois.

Elle suit les **matières premières** (bois, panneaux, quincaillerie, colle, vernis) et les **articles** fabriqués
(tables, chaises, armoires…), depuis l'achat auprès des fournisseurs jusqu'à la vente aux clients, et calcule
quand et combien commander (quantité économique de Wilson et point de commande).

Ce dépôt contient la **front-end React**. Le back-end (base PostgreSQL, sécurité, règles de gestion, comptes,
stockage des photos) est hébergé sur **Supabase**.

---

## Sommaire

1. [Profils et fonctionnalités](#1-profils-et-fonctionnalités)
2. [Écrans](#2-écrans)
3. [Installation et démarrage](#3-installation-et-démarrage)
4. [Architecture de la front-end](#4-architecture-de-la-front-end)
5. [Back-end Supabase](#5-back-end-supabase)
6. [Sécurité](#6-sécurité)
7. [Interface et design](#7-interface-et-design)
8. [Choix et limites](#8-choix-et-limites)
9. [Comptes de test](#9-comptes-de-test)

---

## 1. Profils et fonctionnalités

| Profil | Rôle | Fonctionnalités |
|---|---|---|
| **Gérant** (compte unique) | Achats, pilotage, administration | Stock des matières premières et des articles (consultation, courbes), fournisseurs, devis, comparaison des devis et commandes, paramètres de calcul (S, H, L, j), quantité à commander avec simulation, statistiques (ventes, consommations, analyse ABC, évaluation des fournisseurs, export PDF / Excel), comptes des chefs magasin, journal d'activité, sauvegarde |
| **Chef magasin** | Stock, réception, ventes | Produits (création, modification, fiche avec courbe), mouvements (consommation et production atelier), inventaire, réception des commandes (saisie contrôlée des factures fournisseur), clients, demandes, factures client et impression |
| Les deux | | Connexion, mot de passe provisoire à changer à la première connexion, Mon compte (photo, coordonnées, mot de passe), Mon activité |

### Cycle de gestion

1. Le **chef magasin** crée les produits avec leur stock initial et enregistre chaque jour les consommations et
   la production de l'atelier.
2. Le **gérant** règle les paramètres de calcul de chaque matière première ; le serveur calcule la quantité
   économique **Q\*** et le **point de commande (PC)**. Quand le stock atteint le PC, la matière passe
   « À commander ».
3. Le **gérant** compare les devis des fournisseurs et passe la commande.
4. À la livraison, le **chef magasin** saisit la facture fournisseur : elle est contrôlée par rapport à la commande ;
   si elle est conforme, la commande passe « Reçue » et le stock augmente automatiquement.
5. Le **chef magasin** enregistre les demandes des clients puis établit les factures : le stock est vérifié
   et diminue automatiquement (paiement comptant).

---

## 2. Écrans

### Accès et compte (deux profils)

| Code | Écran | Route |
|---|---|---|
| A1 | Connexion | `/connexion` |
| A2 | Changer le mot de passe provisoire | `/changer-mot-de-passe` |
| A3 | Mon compte | `/gerant/compte`, `/chef/compte` |
| A4 | Mon activité | `/gerant/activite`, `/chef/activite` |

### Gérant

| Code | Écran | Route |
|---|---|---|
| B1 | Tableau de bord | `/gerant` |
| B2 | Stock des matières premières | `/gerant/stock/matieres` |
| B3 | Stock des articles | `/gerant/stock/articles` |
| B4, B5, B5bis | Fournisseurs : liste, fiche et évaluation, ajout / modification | `/gerant/fournisseurs`, `/:id`, `/nouveau`, `/:id/modifier` |
| B6, B6bis | Devis : liste, ajout / modification | `/gerant/devis`, `/nouveau`, `/:id/modifier` |
| B7 | Comparer les devis et commander | `/gerant/commander?produit=id` |
| B8, B8bis | Commandes : liste, détail | `/gerant/commandes`, `/:id` |
| B9 | Paramètres de calcul | `/gerant/parametres` |
| B10 | Quantité à commander (détail et simulation) | `/gerant/calcul` |
| B11 | Statistiques | `/gerant/statistiques` |
| B12, B12bis, B12ter | Utilisateurs : liste, fiche et activité, création / modification | `/gerant/utilisateurs`, `/:id`, `/nouveau`, `/:id/modifier` |
| B13 | Activité des chefs magasin | `/gerant/activite-chefs` |
| B14 | Sauvegarde des données | `/gerant/sauvegarde` |

### Chef magasin

| Code | Écran | Route |
|---|---|---|
| C1 | Tableau de bord | `/chef` |
| C2, C3, C3bis | Produits : liste, fiche avec courbe, ajout / modification | `/chef/produits`, `/:id`, `/nouveau`, `/:id/modifier` |
| C4, C5 | Mouvements : journal, nouveau mouvement | `/chef/mouvements`, `/nouveau` |
| C6 | Inventaire | `/chef/inventaire` |
| C7, C7bis | Factures fournisseur : liste, saisie contrôlée | `/chef/factures-fournisseur`, `/nouvelle?commande=id` |
| C8 | Clients (ajout et modification en fenêtre) | `/chef/clients` |
| C9, C9bis | Demandes : liste, ajout / modification | `/chef/demandes`, `/nouvelle`, `/:id/modifier` |
| C10, C10bis, C10ter | Factures client : liste, établissement, facture imprimable A4 | `/chef/factures-client`, `/nouvelle?demande=id`, `/:id/imprimer` |

Un profil n'ouvre jamais les écrans de l'autre : il est renvoyé vers son tableau de bord. Une adresse inconnue
affiche une page 404.

---

## 3. Installation et démarrage

| Prérequis | Version |
|---|---|
| Node.js | 20.19 ou plus récent (LTS conseillée) |
| npm | fourni avec Node.js |
| Navigateur | Chrome, Edge ou Firefox récent |

```powershell
npm install          # installe les dépendances
npm run dev          # serveur de développement → http://localhost:5173
npm run build        # build de production dans dist/
npm run preview      # sert le build de production en local
npm run lint         # vérification du code (oxlint)
npm run format       # mise en forme (Prettier)
```

### Configuration

- `src/config/supabase.js` : URL du projet Supabase et **clé publishable**. Ces deux valeurs sont publiques par
  conception ; aucun fichier `.env` n'est nécessaire. La clé `service_role` n'est jamais utilisée côté navigateur.
- `src/config/entreprise.js` : nom, adresse et téléphone de NBM imprimés sur les factures client.

---

## 4. Architecture de la front-end

### Pile technique

| Rôle | Bibliothèques |
|---|---|
| Base | Vite 8, React 19 (JavaScript) |
| Navigation | React Router 8 (routes imbriquées, gardes par profil, chargement différé des pages) |
| Données | @supabase/supabase-js 2, TanStack Query 5 (cache, invalidation, rafraîchissement) |
| Interface | Tailwind CSS 4, composants shadcn/ui (Radix), lucide-react, sonner (notifications) |
| Animations | Motion (transitions courtes, désactivées si le système demande moins d'animations) |
| Formulaires | react-hook-form + zod |
| Graphiques | Recharts |
| Dates | date-fns (locale française) |
| Exports | jspdf + jspdf-autotable (PDF), exceljs (Excel), chargés uniquement au moment de l'export |
| Qualité | oxlint, Prettier |

### Structure

```
src/
  main.jsx, App.jsx        point d'entrée et fournisseurs : thème, cache, session, infobulles, animations, routeur
  routes.jsx               routes, chargement différé des pages, gardes par profil, fil d'Ariane
  index.css                thème : variables de couleurs (clair / sombre) reliées à Tailwind et shadcn/ui
  config/                  configuration publique Supabase, identité de l'entreprise
  api/                     une fonction par appel Supabase, regroupées par domaine
    auth.js                  connexion, mot de passe provisoire, déconnexion
    stock.js                 produits, état du stock, mouvements, inventaire, paramètres de calcul
    mouvements.js            journal des mouvements (pagination côté serveur), résumés
    achats.js                fournisseurs, devis, commandes, factures fournisseur
    ventes.js                clients, demandes, factures client
    utilisateurs.js          comptes, photos, Edge Function gerer-comptes
    journal.js               journal d'activité, sauvegarde
  hooks/                   session (useAuth), lectures partagées, compteurs du menu, suppression, comptes
  lib/
    supabase.js              client Supabase unique
    requetes.js              cache TanStack Query, lecture par paquets de 1 000 lignes, invalidation par domaine
    format.js                montants en DT, dates, téléphone, références, montant en lettres
    erreurs.js               messages d'erreur clairs (Supabase, Edge Functions)
    etats.js                 états du back-end → libellés et couleurs des badges
    schemas.js               règles de saisie (zod) partagées
    periodes.js, exports.js  périodes d'analyse ; exports PDF / Excel
  components/
    ui/                      composants shadcn/ui adaptés au design (licence MIT)
    layout/                  AppShell, menu latéral, en-tête, fil d'Ariane, thème, alertes, gardes de routes
    commun/                  DataTable, Combobox, Onglets, StatCard, Badge, graphiques, journal, formulaires…
  pages/
    auth/                    connexion, mot de passe provisoire
    commun/                  Mon compte, Mon activité
    gerant/                  écrans du gérant
    chef/                    écrans du chef magasin
    erreurs/                 pages 404 et erreur
public/                    favicon
```

### Principes

- **Une seule porte vers le back-end** : `src/lib/supabase.js`, appelé uniquement depuis `src/api/`.
- **Données toujours à jour** : après chaque action, les données concernées sont invalidées puis relues ;
  elles sont aussi relues au retour sur l'onglet du navigateur, et les tableaux de bord, compteurs du menu
  et alertes se rafraîchissent chaque minute.
- **Volumes** : l'API Supabase renvoie au plus 1 000 lignes par requête ; les grandes lectures se font par
  paquets et le journal des mouvements est paginé côté serveur.
- **Quatre états par écran** : chargement (squelettes), vide (message et action), erreur (message et
  « Réessayer »), données.

---

## 5. Back-end Supabase

Projet `gestion-stock` : PostgreSQL 17, région Paris. 12 tables (RLS activée partout), 4 vues, fonctions RPC,
2 Edge Functions, un espace de stockage privé pour les photos.

### Tables

| Table | Contenu |
|---|---|
| `utilisateur` | Comptes : identité, coordonnées, photo, profil (`GERANT` / `CHEF_MAGASIN`), actif, mot de passe à changer, dates |
| `produit` | Matières premières (`MP`) et articles (`ARTICLE`) : code, désignation, unité, stock, prix de vente, seuil minimum, paramètres de calcul (S, H, L, j, période), Q\*, PC, actif |
| `mouvement_stock` | Entrées et sorties : produit, date, type, quantité, motif, utilisateur |
| `fournisseur` | Raison sociale, adresse, téléphone, e-mail, actif |
| `devis` | Fournisseur, matière première, date, prix unitaire, délai de livraison |
| `commande_fournisseur` | Devis retenu, date, quantité, état (`EN_ATTENTE` / `RECUE` / `ANNULEE`) |
| `facture_fournisseur` | Facture d'une commande : numéro, date, quantité, prix, montant |
| `client` | Nom, téléphone, adresse, actif |
| `demande_client` | Client, date, canal (`TELEPHONE` / `FAX` / `SUR_PLACE`), état (`EN_ATTENTE` / `FACTUREE` / `ANNULEE`) |
| `ligne_demande` | Articles d'une demande : quantité, prix unitaire |
| `facture_client` | Facture d'une demande : numéro `FC-AAAA-NNNN`, date, montant |
| `journal_activite` | Historique des opérations, alimenté automatiquement par le serveur |

Motifs de mouvement : `Stock initial`, `Réception fournisseur`, `Production atelier` (entrées) ;
`Consommation atelier`, `Vente` (sorties) ; `Inventaire` (entrée ou sortie). Les réceptions et les ventes sont
créées automatiquement par les factures.

### Vues

| Vue | Usage |
|---|---|
| `v_etat_stock` | État de chaque produit : seuil (PC ou seuil minimum), Q\*, consommation / ventes / production sur 90 jours, couverture en jours, alerte, commande en cours, état (`SUFFISANT`, `A_COMMANDER`, `COMMANDE_EN_COURS`, `A_PRODUIRE`) |
| `v_commandes_retard` | Commandes en attente dont la date prévue (commande + délai du devis) est dépassée |
| `v_evaluation_fournisseurs` | Commandes reçues, délai annoncé moyen, délai réel moyen, retard moyen |
| `v_analyse_abc` | Classement des matières premières par valeur consommée (classes A, B, C) |

### Fonctions RPC

Chaque fonction vérifie le profil de l'appelant, s'exécute en une transaction et renvoie ses erreurs en français.

| Domaine | Fonctions |
|---|---|
| Connexion | `enregistrer_connexion`, `confirmer_changement_mdp`, `profil_courant`, `est_gerant`, `est_chef` |
| Achats (gérant) | `passer_commande`, `annuler_commande`, `simuler_calcul` |
| Stock (chef) | `creer_produit`, `enregistrer_mouvement`, `enregistrer_inventaire` |
| Réception et ventes (chef) | `saisir_facture_fournisseur`, `enregistrer_demande`, `modifier_demande`, `annuler_demande`, `etablir_facture_client` |
| Référentiels | `supprimer_ou_desactiver` (supprime s'il n'y a aucune donnée liée, sinon désactive) |

Calcul de la quantité à commander (`simuler_calcul`) : demande moyenne d = sorties / N jours, demande annuelle
D = d × 365, **Q\* = ⌈√(2·D·S / H)⌉**, stock de sécurité SS = d × j, **PC = ⌈d × L + SS⌉**,
coût annuel = S·D/Q\* + H·Q\*/2.

### Edge Functions (gérant uniquement)

| Fonction | Rôle |
|---|---|
| `gerer-comptes` | Créer un compte chef magasin (mot de passe provisoire), réinitialiser un mot de passe, modifier un e-mail, supprimer ou désactiver, réactiver |
| `sauvegarder-donnees` | Exporter toutes les tables dans un fichier JSON horodaté |

### Stockage

Bucket privé `photos` : une photo de profil par utilisateur (`<id>/avatar.<ext>`), JPG, PNG ou WebP, 2 Mo maximum,
affichée par une URL signée temporaire.

---

## 6. Sécurité

- **Authentification** : Supabase Auth (e-mail et mot de passe). Pas d'inscription libre : seul le gérant crée
  les comptes. Mot de passe provisoire obligatoirement remplacé à la première connexion.
- **Droits** : assurés par la RLS côté serveur. Un visiteur non connecté n'a accès à rien ; chacun ne voit
  que ce que son profil autorise. L'interface masque en plus ce qu'un profil ne peut pas faire.
- **Écritures** : le stock et les documents (commandes, factures, demandes, mouvements) ne s'écrivent que par les
  fonctions RPC. Les écritures directes sont limitées aux fournisseurs et devis (gérant), aux clients (chef),
  aux fiches et paramètres des produits et aux coordonnées des comptes.
- **Clés** : seule la clé publishable est présente dans le code ; la clé d'administration reste côté serveur,
  dans les Edge Functions.
- **Traçabilité** : chaque opération est enregistrée dans le journal d'activité, non modifiable.

---

## 7. Interface et design

- **Style** : fond clair légèrement chaud, menu latéral noir, cartes blanches, boutons principaux noirs, touche
  dorée (logo, compteurs), badges d'état aux couleurs douces.
- **Polices** : Fraunces (titres) et Inter (texte).
- **Thèmes** : clair et sombre, bouton dans l'en-tête, choix mémorisé dans le navigateur.
- **Couleurs d'état** : vert (suffisant, reçue, facturée), rouge brique (à commander, en retard, erreur),
  ocre (à produire, en attente), bleu ardoise (commande en cours, information), gris (annulée, inactif).
- **Mise en page** : ordinateur et tablette ; sous 1024 px, le menu latéral devient un panneau coulissant.
- **Tableaux** : paginés par 10 lignes, triables, avec recherche (combobox pour les listes longues) et
  onglets pour les filtres à peu de choix.
- **Accessibilité** : navigation au clavier, focus visible, libellés reliés aux champs, `aria-label` sur les
  boutons-icônes.
- **Formats** : montants `1 234,500 DT` (3 décimales) dans les documents, arrondis dans les indicateurs ;
  dates `13/11/2026` ; téléphone tunisien à 8 chiffres ; montant en lettres sur les factures.

---

## 8. Choix et limites

| Sujet | Fonctionnement retenu |
|---|---|
| Mouvements | Un mouvement enregistré n'est jamais modifié ni supprimé ; les corrections passent par l'inventaire. Le motif est déduit du produit (matière première → consommation atelier, article → production atelier) |
| Valeur du stock des matières premières | Calculée dans l'interface : stock × dernier prix d'achat facturé (à défaut, meilleur devis) |
| Création des produits | Réservée au chef magasin ; le gérant règle les paramètres de calcul et passe les commandes |
| Modification d'une demande | Seuls le canal et les articles changent ; le client et la date restent fixes |
| Devis utilisé dans une commande | Verrouillé : ni modification ni suppression (RG09) |
| Suppression d'un fournisseur, client, produit ou compte | Supprimé s'il n'a aucune donnée liée, sinon désactivé (historique conservé, réactivation possible) |

---

## 9. Comptes de test

- Gérant : `gerant@gmail.com`
- Chef magasin : `chef@gmail.com`

Les mots de passe ne figurent dans aucun fichier du dépôt.
