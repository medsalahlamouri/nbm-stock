# Maquette — index des captures

Captures PNG de la maquette « Maquette NBM Stock », dans
`docs/maquette/Maquette NBM Stock-png/`.

Les chiffres et les noms affichés sont des **exemples** : l'application lit toujours les données réelles de Supabase.
**La maquette fait foi pour le visuel, `docs/BACKEND.md` pour les données et les règles.**

---

## 1. Correspondance captures → fiches de `docs/ECRANS.md`

| Capture | Fiche | Écran | Route | Lot |
|---|---|---|---|---|
| `1a · Connexion` | A1 | Connexion | `/connexion` | 1 |
| `1b · Première connexion — mot de passe provisoire` | A2 | Changer le mot de passe provisoire | `/changer-mot-de-passe` | 1 |
| `2a · Tableau de bord du gérant` | B1 | Tableau de bord gérant | `/gerant` | 7 |
| `2b · Tableau de bord du chef magasin` | C1 | Tableau de bord chef | `/chef` | 7 |
| `3a · Mon compte — gérant` | A3 | Mon compte (gérant) | `/gerant/compte` | 1 |
| `3b · Mon compte — chef magasin` | A3 | Mon compte (chef) | `/chef/compte` | 1 |
| `4a · Fournisseurs — liste, actifs inactifs, supprimer ou désactiver` | B4 | Fournisseurs | `/gerant/fournisseurs` | 2 |
| `4b · Nouveau fournisseur` | B5bis | Ajouter un fournisseur | `/gerant/fournisseurs/nouveau` | 2 |
| `4c · Fournisseur — fiche et évaluation` | B5 | Fiche fournisseur | `/gerant/fournisseurs/:id` | 2 |
| `4d · Modifier un fournisseur (champs modifiés signalés, désactivation)` | B5bis | Modifier un fournisseur | `/gerant/fournisseurs/:id/modifier` | 2 |
| `5a · Devis — liste et suppression` | B6 | Devis | `/gerant/devis` | 2 |
| `5b · Nouveau devis` | B6bis | Ajouter un devis | `/gerant/devis/nouveau` | 2 |
| `5c · Modifier un devis non utilisé (suppression)` | B6bis | Modifier un devis | `/gerant/devis/:id/modifier` | 2 |
| `6a · Comparer les devis et commander` | B7 | Comparer et commander | `/gerant/commander` | 2 |
| `6b · Commandes — liste, retards, annulation` | B8 | Commandes | `/gerant/commandes` | 2 |
| `6c · Commande — détail et retard` | B8bis | Détail d'une commande | `/gerant/commandes/:id` | 2 |
| `7a · Utilisateurs — liste, statut, réinitialisation` | B12 | Utilisateurs | `/gerant/utilisateurs` | 6 |
| `7b · Nouveau compte chef magasin` | B12ter | Créer un chef magasin | `/gerant/utilisateurs/nouveau` | 6 |
| `7c · Utilisateur — fiche et onglet Activité` | B12bis | Fiche utilisateur | `/gerant/utilisateurs/:id` | 6 |
| `7d · Sauvegarde des données` | B14 | Sauvegarde | `/gerant/sauvegarde` | 6 |
| `7e · Modifier un compte` | B12ter | Modifier un chef magasin | `/gerant/utilisateurs/:id/modifier` | 6 |
| `7f · Activité des chefs magasin (consultation par le gérant)` | B13 | Activité des chefs | `/gerant/activite-chefs` | 6 |
| `8a · Stock des matières premières` | B2 | Stock des MP | `/gerant/stock/matieres` | 5 |
| `8b · Stock des articles` | B3 | Stock des articles | `/gerant/stock/articles` | 5 |
| `8c · Mon activité — gérant` | A4 | Mon activité (gérant) | `/gerant/activite` | 1 |
| `10a · Produits — onglets MP articles, actifs inactifs` | C2 | Produits | `/chef/produits` | 3 |
| `10b · Nouveau produit` | C3bis | Ajouter un produit | `/chef/produits/nouveau` | 3 |
| `10c · Produit — fiche et historique` | C3 | Fiche produit | `/chef/produits/:id` | 3 |
| `10d · Modifier un produit (type et stock verrouillés)` | C3bis | Modifier un produit | `/chef/produits/:id/modifier` | 3 |
| `11a · Mouvements — MP articles séparés, modifier, supprimer` | C4 | Mouvements | `/chef/mouvements` | 3 |
| `11b · Nouveau mouvement — type, produit, motif, quantité` | C5 | Nouveau mouvement | `/chef/mouvements/nouveau` | 3 |
| `11c · Inventaire — comptage et ajustement` | C6 | Inventaire | `/chef/inventaire` | 3 |
| `11d · Mon activité — chef magasin` | A4 | Mon activité (chef) | `/chef/activite` | 1 |
| `11e · Modifier un mouvement saisi (effet sur le stock, suppression)` | C5 | *(voir écarts)* | — | 3 |
| `12a · Factures fournisseur — liste et commandes à réceptionner` | C7 | Factures fournisseur | `/chef/factures-fournisseur` | 4 |
| `12b · Saisir une facture fournisseur (contrôle)` | C7bis | Saisir une facture fournisseur | `/chef/factures-fournisseur/nouvelle` | 4 |
| `13a · Clients — liste, actifs inactifs` | C8 | Clients | `/chef/clients` | 4 |
| `13b · Demandes — liste, modification, annulation` | C9 | Demandes | `/chef/demandes` | 4 |
| `13c · Nouvelle demande client` | C9bis | Nouvelle demande | `/chef/demandes/nouvelle` | 4 |
| `13d · Nouveau client` | C8 | Ajouter un client (fenêtre) | `/chef/clients` | 4 |
| `13e · Modifier un client` | C8 | Modifier un client (fenêtre) | `/chef/clients` | 4 |
| `13f · Modifier une demande en attente (annulation)` | C9bis | Modifier une demande | `/chef/demandes/:id/modifier` | 4 |
| `14a · Factures client — liste` | C10 | Factures client | `/chef/factures-client` | 4 |
| `14b · Établir une facture (vérification du stock)` | C10bis | Établir une facture | `/chef/factures-client/nouvelle` | 4 |
| `14c · Facture imprimable (A4)` | C10ter | Facture imprimable | `/chef/factures-client/:id/imprimer` | 4 |
| `15a · Paramètres de calcul (S, H, L, j, période)` | B9 | Paramètres de calcul | `/gerant/parametres` | 5 |
| `15b · Quantité à commander — détail et simulation` | B10 | Quantité à commander | `/gerant/calcul` | 5 |
| `15c · Statistiques — ABC, fournisseurs, export` | B11 | Statistiques | `/gerant/statistiques` | 5 |

La numérotation des captures saute de 8 à 10 (pas de série 9) : aucune fiche n'en dépend.

## 2. Écrans sans capture

Toutes les fiches de `docs/ECRANS.md` ont au moins une capture. Sont sans capture (conçus à partir de `docs/DESIGN.md`) :

- la **page 404** et la **page d'erreur** générale ;
- les **panneaux de détail** des stocks B2 / B3 (courbe d'évolution) : reprise du style de la courbe de `10c` ;
- les **fenêtres** de confirmation et du mot de passe provisoire (style des cartes et boutons de `DESIGN.md`) ;
- les états **chargement / vide / erreur** de chaque écran.

## 3. Écarts entre la maquette et le back-end (le back-end fait foi)

| Capture | Ce que montre la maquette | Ce que permet le back-end | Choix retenu |
|---|---|---|---|
| `11a`, `11e` | Modifier ou supprimer un mouvement saisi ; motifs « Retour atelier », « Perte / casse » ; date, heure, observation | Aucune RPC de modification ni de suppression ; `enregistrer_mouvement(p_id_produit, p_quantite)` déduit le motif (MP → Consommation atelier, article → Production atelier). C5 : « un mouvement enregistré n'est jamais modifiable » | Pas de modification ni de suppression. Les corrections passent par l'**inventaire** (C6). `11e` sert de modèle visuel pour l'aperçu « Effet sur le stock » de C5. |
| `11b` | Choix du type et du motif | Motif imposé par le type du produit | Motif affiché en lecture seule, déduit du produit |

| `2a`, `8a`, `15c` | « Valeur du stock MP » | `v_etat_stock.valeur_stock` n'est renseignée que pour les articles (stock × prix de vente) | Calculée dans la front-end : stock × dernier prix d'achat facturé (à défaut, meilleur devis) |
| `7a` | Références `USR-02`, `USR-03` | `id_utilisateur` est un uuid, sans numéro | Pas de référence affichée (rien n'est inventé) ; e-mail en sous-ligne |
| `14c` | Adresse et téléphone de NBM sur la facture | Aucune table « entreprise » | Nom et ville seulement, à compléter dans `src/config/entreprise.js` |
| `4c` | « fournisseur depuis avril 2026 » | Pas de date de création dans `fournisseur` | Non affiché |
| `13f`, `11b` | Date et heure modifiables | `modifier_demande` ne modifie ni client ni date ; `enregistrer_mouvement` date le mouvement à l'instant | Champs verrouillés ou absents |
