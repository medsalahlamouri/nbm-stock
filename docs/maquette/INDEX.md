# Maquette — index des captures

Captures PNG de la maquette « Maquette NBM Stock », dans
`docs/maquette/captures/`.

Les chiffres et les noms affichés sont des **exemples** : l'application lit toujours les données réelles de Supabase.
**La maquette fait foi pour le visuel, `docs/BACKEND.md` pour les données et les règles.**

---

## 1. Correspondance captures → fiches de `docs/ECRANS.md`

| Capture | Fiche | Écran | Route | Lot |
|---|---|---|---|---|
| [`01a-connexion.png`](captures/01a-connexion.png) | A1 | Connexion | `/connexion` | 1 |
| [`01b-premiere-connexion-mot-de-passe-provisoire.png`](captures/01b-premiere-connexion-mot-de-passe-provisoire.png) | A2 | Changer le mot de passe provisoire | `/changer-mot-de-passe` | 1 |
| [`02a-tableau-de-bord-du-gerant.png`](captures/02a-tableau-de-bord-du-gerant.png) | B1 | Tableau de bord gérant | `/gerant` | 7 |
| [`02b-tableau-de-bord-du-chef-magasin.png`](captures/02b-tableau-de-bord-du-chef-magasin.png) | C1 | Tableau de bord chef | `/chef` | 7 |
| [`03a-mon-compte-gerant.png`](captures/03a-mon-compte-gerant.png) | A3 | Mon compte (gérant) | `/gerant/compte` | 1 |
| [`03b-mon-compte-chef-magasin.png`](captures/03b-mon-compte-chef-magasin.png) | A3 | Mon compte (chef) | `/chef/compte` | 1 |
| [`04a-fournisseurs-liste-actifs-inactifs-supprimer-ou.png`](captures/04a-fournisseurs-liste-actifs-inactifs-supprimer-ou.png) | B4 | Fournisseurs | `/gerant/fournisseurs` | 2 |
| [`04b-nouveau-fournisseur.png`](captures/04b-nouveau-fournisseur.png) | B5bis | Ajouter un fournisseur | `/gerant/fournisseurs/nouveau` | 2 |
| [`04c-fournisseur-fiche-et-evaluation.png`](captures/04c-fournisseur-fiche-et-evaluation.png) | B5 | Fiche fournisseur | `/gerant/fournisseurs/:id` | 2 |
| [`04d-modifier-un-fournisseur-champs-modifies-signales.png`](captures/04d-modifier-un-fournisseur-champs-modifies-signales.png) | B5bis | Modifier un fournisseur | `/gerant/fournisseurs/:id/modifier` | 2 |
| [`05a-devis-liste-et-suppression.png`](captures/05a-devis-liste-et-suppression.png) | B6 | Devis | `/gerant/devis` | 2 |
| [`05b-nouveau-devis.png`](captures/05b-nouveau-devis.png) | B6bis | Ajouter un devis | `/gerant/devis/nouveau` | 2 |
| [`05c-modifier-un-devis-non-utilise-suppression.png`](captures/05c-modifier-un-devis-non-utilise-suppression.png) | B6bis | Modifier un devis | `/gerant/devis/:id/modifier` | 2 |
| [`06a-comparer-les-devis-et-commander.png`](captures/06a-comparer-les-devis-et-commander.png) | B7 | Comparer et commander | `/gerant/commander` | 2 |
| [`06b-commandes-liste-retards-annulation.png`](captures/06b-commandes-liste-retards-annulation.png) | B8 | Commandes | `/gerant/commandes` | 2 |
| [`06c-commande-detail-et-retard.png`](captures/06c-commande-detail-et-retard.png) | B8bis | Détail d'une commande | `/gerant/commandes/:id` | 2 |
| [`07a-utilisateurs-liste-statut-reinitialisation.png`](captures/07a-utilisateurs-liste-statut-reinitialisation.png) | B12 | Utilisateurs | `/gerant/utilisateurs` | 6 |
| [`07b-nouveau-compte-chef-magasin.png`](captures/07b-nouveau-compte-chef-magasin.png) | B12ter | Créer un chef magasin | `/gerant/utilisateurs/nouveau` | 6 |
| [`07c-utilisateur-fiche-et-onglet-activite.png`](captures/07c-utilisateur-fiche-et-onglet-activite.png) | B12bis | Fiche utilisateur | `/gerant/utilisateurs/:id` | 6 |
| [`07d-sauvegarde-des-donnees.png`](captures/07d-sauvegarde-des-donnees.png) | B14 | Sauvegarde | `/gerant/sauvegarde` | 6 |
| [`07e-modifier-un-compte.png`](captures/07e-modifier-un-compte.png) | B12ter | Modifier un chef magasin | `/gerant/utilisateurs/:id/modifier` | 6 |
| [`07f-activite-des-chefs-magasin-consultation-par.png`](captures/07f-activite-des-chefs-magasin-consultation-par.png) | B13 | Activité des chefs | `/gerant/activite-chefs` | 6 |
| [`08a-stock-des-matieres-premieres.png`](captures/08a-stock-des-matieres-premieres.png) | B2 | Stock des MP | `/gerant/stock/matieres` | 5 |
| [`08b-stock-des-articles.png`](captures/08b-stock-des-articles.png) | B3 | Stock des articles | `/gerant/stock/articles` | 5 |
| [`08c-mon-activite-gerant.png`](captures/08c-mon-activite-gerant.png) | A4 | Mon activité (gérant) | `/gerant/activite` | 1 |
| [`10a-produits-onglets-mp-articles-actifs-inactifs.png`](captures/10a-produits-onglets-mp-articles-actifs-inactifs.png) | C2 | Produits | `/chef/produits` | 3 |
| [`10b-nouveau-produit.png`](captures/10b-nouveau-produit.png) | C3bis | Ajouter un produit | `/chef/produits/nouveau` | 3 |
| [`10c-produit-fiche-et-historique.png`](captures/10c-produit-fiche-et-historique.png) | C3 | Fiche produit | `/chef/produits/:id` | 3 |
| [`10d-modifier-un-produit-type-et-stock.png`](captures/10d-modifier-un-produit-type-et-stock.png) | C3bis | Modifier un produit | `/chef/produits/:id/modifier` | 3 |
| [`11a-mouvements-mp-articles-separes-modifier-supprimer.png`](captures/11a-mouvements-mp-articles-separes-modifier-supprimer.png) | C4 | Mouvements | `/chef/mouvements` | 3 |
| [`11b-nouveau-mouvement-type-produit-motif-quantite.png`](captures/11b-nouveau-mouvement-type-produit-motif-quantite.png) | C5 | Nouveau mouvement | `/chef/mouvements/nouveau` | 3 |
| [`11c-inventaire-comptage-et-ajustement.png`](captures/11c-inventaire-comptage-et-ajustement.png) | C6 | Inventaire | `/chef/inventaire` | 3 |
| [`11d-mon-activite-chef-magasin.png`](captures/11d-mon-activite-chef-magasin.png) | A4 | Mon activité (chef) | `/chef/activite` | 1 |
| [`11e-modifier-un-mouvement-saisi-effet-sur.png`](captures/11e-modifier-un-mouvement-saisi-effet-sur.png) | C5 | *(voir écarts)* | — | 3 |
| [`12a-factures-fournisseur-liste-et-commandes-a.png`](captures/12a-factures-fournisseur-liste-et-commandes-a.png) | C7 | Factures fournisseur | `/chef/factures-fournisseur` | 4 |
| [`12b-saisir-une-facture-fournisseur-controle.png`](captures/12b-saisir-une-facture-fournisseur-controle.png) | C7bis | Saisir une facture fournisseur | `/chef/factures-fournisseur/nouvelle` | 4 |
| [`13a-clients-liste-actifs-inactifs.png`](captures/13a-clients-liste-actifs-inactifs.png) | C8 | Clients | `/chef/clients` | 4 |
| [`13b-demandes-liste-modification-annulation.png`](captures/13b-demandes-liste-modification-annulation.png) | C9 | Demandes | `/chef/demandes` | 4 |
| [`13c-nouvelle-demande-client.png`](captures/13c-nouvelle-demande-client.png) | C9bis | Nouvelle demande | `/chef/demandes/nouvelle` | 4 |
| [`13d-nouveau-client.png`](captures/13d-nouveau-client.png) | C8 | Ajouter un client (fenêtre) | `/chef/clients` | 4 |
| [`13e-modifier-un-client.png`](captures/13e-modifier-un-client.png) | C8 | Modifier un client (fenêtre) | `/chef/clients` | 4 |
| [`13f-modifier-une-demande-en-attente-annulation.png`](captures/13f-modifier-une-demande-en-attente-annulation.png) | C9bis | Modifier une demande | `/chef/demandes/:id/modifier` | 4 |
| [`14a-factures-client-liste.png`](captures/14a-factures-client-liste.png) | C10 | Factures client | `/chef/factures-client` | 4 |
| [`14b-etablir-une-facture-verification-du-stock.png`](captures/14b-etablir-une-facture-verification-du-stock.png) | C10bis | Établir une facture | `/chef/factures-client/nouvelle` | 4 |
| [`14c-facture-imprimable-a4.png`](captures/14c-facture-imprimable-a4.png) | C10ter | Facture imprimable | `/chef/factures-client/:id/imprimer` | 4 |
| [`15a-parametres-de-calcul-s-h-l.png`](captures/15a-parametres-de-calcul-s-h-l.png) | B9 | Paramètres de calcul | `/gerant/parametres` | 5 |
| [`15b-quantite-a-commander-detail-et-simulation.png`](captures/15b-quantite-a-commander-detail-et-simulation.png) | B10 | Quantité à commander | `/gerant/calcul` | 5 |
| [`15c-statistiques-abc-fournisseurs-export.png`](captures/15c-statistiques-abc-fournisseurs-export.png) | B11 | Statistiques | `/gerant/statistiques` | 5 |

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
