# Écrans de l'application — fiches de développement

Une fiche par écran de la maquette (fichier `*.dc.html` d'origine entre parenthèses).
G = gérant, C = chef magasin. Les sources de données renvoient à `docs/BACKEND.md`.
Pour la mise en page exacte, se reporter à la capture correspondante de la maquette (`docs/maquette/INDEX.md`).

---

## A. Accès et compte (G, C)

### A1. Connexion — `/connexion` (Main)
- Voir `DESIGN.md` §6. Validation : e-mail valide, mot de passe non vide.
- `signInWithPassword` → `rpc('enregistrer_connexion')` → redirection selon `profil` :
  `GERANT` → `/gerant`, `CHEF_MAGASIN` → `/chef`. Si `doit_changer_mdp` → `/changer-mot-de-passe`.
- Erreur d'identifiants : encart « E-mail ou mot de passe incorrect. » Compte désactivé : message du serveur.
- Bouton « Se connecter » avec état de chargement ; touche Entrée active.

### A2. Changer le mot de passe provisoire — `/changer-mot-de-passe` (Changer-MDP)
- Accessible uniquement si `doit_changer_mdp`. Même habillage que la connexion.
- Nouveau mot de passe + confirmation ; règles affichées (8 caractères minimum, lettres et chiffres)
  avec indicateurs ✓ en direct.
- `auth.updateUser({ password })` → `rpc('confirmer_changement_mdp')` → tableau de bord.

### A3. Mon compte — `/gerant/compte` (Compte-Gerant), `/chef/compte` (Compte-Chef)
- Même interface pour les deux profils, en sections : **Identité** (photo, nom, prénom, date de naissance),
  **Coordonnées** (e-mail, téléphone, adresse, ville, code postal), **Informations du compte**
  (profil, date de création, dernière connexion — lecture seule), **Mot de passe** (nouveau + confirmation).
- Photo : upload Storage (`DESIGN` : avatar rond), aperçu, retrait.
- Chef : e-mail et profil **non modifiables** (champs verrouillés avec info-bulle « Modifiable par le gérant »).
- Gérant : e-mail modifiable via `gerer-comptes` / `modifier_email` (sans `id_utilisateur`) ; profil non modifiable.
- Enregistrement : `update utilisateur` (sa ligne) ; toast de confirmation.

### A4. Mon activité — `/gerant/activite` (Activite-Gerant), `/chef/activite` (Activite-Chef)
- Source : `journal_activite` filtré sur l'utilisateur connecté.
- Indicateurs (chef) : nombre de mouvements, de factures, de demandes sur la période ;
  répartition des mouvements par motif (barres).
- Journal paginé : date et heure, action (badge), objet, détail. Filtres en onglets
  (chef : Tout / Stock / Achats / Ventes ; gérant : Tout / Achats / Comptes / Statistiques) + période.

---

## B. Gérant

### B1. Tableau de bord — `/gerant` (Dashboard-Gerant)
- Titre « Bonjour {prénom} » + phrase d'introduction ; boutons « Sauvegarder » (secondaire) et « Nouvelle commande » (principal).
- 4 indicateurs cliquables : **Matières en alerte** (nb MP `en_alerte`, détail « x à commander, y commande en cours »),
  **Commandes en retard** (`v_commandes_retard`, détail « n commandes en attente de livraison »),
  **Ventes du mois précédent** (somme `facture_client.montant_total`), **Valeur du stock MP** (somme `valeur_stock` des MP).
- **À traiter** : produits en alerte (`v_etat_stock.en_alerte`) avec badge d'état et action
  (« Commander » → B6 présélectionné, « Voir la commande » → B8).
- **Ventes des 6 derniers mois** : histogramme (facture_client groupée par mois, mois en cours signalé).
- **Commandes en attente de livraison** : tableau (n°, matière · fournisseur, quantité, livraison prévue,
  état : « En retard · N j » / « Prévue aujourd'hui » / « Dans N j »).

### B2. Stock des matières premières — `/gerant/stock/matieres` (Stock-MP)
- Source : `v_etat_stock` où `type = 'MP'` et `actif`. Lecture seule.
- Indicateurs : nombre de MP, en alerte, commandes en cours, valeur totale.
- Tableau : code, désignation, stock + unité, PC, Q*, couverture (jours), état (badge), action « Commander » si à commander.
- Filtres : recherche (combobox) + onglets d'état (Toutes / À commander / Commande en cours / Suffisant).
- Clic sur une ligne → panneau ou page de détail avec la **courbe d'évolution du stock** (extension UC15) :
  série reconstituée à partir de `mouvement_stock` (stock actuel puis remontée des mouvements), ligne du PC en pointillé.

### B3. Stock des articles — `/gerant/stock/articles` (Stock-Articles)
- Source : `v_etat_stock` où `type = 'ARTICLE'`. Lecture seule.
- Tableau : code, désignation, stock, seuil, prix de vente, valeur, vendus 90 j, produits 90 j, état (Suffisant / À produire).
- Même filtres et même courbe que B2 (ligne du seuil minimum).

### B4. Fournisseurs — `/gerant/fournisseurs` (Fournisseurs)
- Tableau : raison sociale, téléphone, e-mail, nombre de devis, nombre de commandes, retard moyen, statut.
- Recherche + onglets Actifs / Inactifs. Bouton « Nouveau fournisseur ».
- Actions par ligne : voir, modifier, supprimer ou désactiver (`supprimer_ou_desactiver('fournisseur', id)`), réactiver.

### B5. Fiche fournisseur — `/gerant/fournisseurs/:id` (Fournisseur-Detail)
- En-tête : raison sociale, statut, coordonnées, boutons Modifier / Désactiver.
- **Évaluation** (`v_evaluation_fournisseurs`) : commandes reçues, délai annoncé moyen, délai réel moyen, retard moyen.
- Onglets : **Devis** (MP, prix, délai, date, verrouillé si utilisé) et **Commandes** (n°, MP, quantité, date, état).

### B5bis. Ajouter / modifier un fournisseur — `/gerant/fournisseurs/nouveau`, `/:id/modifier` (Fournisseur-Form, Fournisseur-Edit)
- Champs : raison sociale (obligatoire), adresse, téléphone (8 chiffres), e-mail (format vérifié).
- `insert` / `update fournisseur`. Retour à la fiche avec toast.

### B6. Devis — `/gerant/devis` (Devis)
- Tableau : MP, fournisseur, date, prix unitaire, délai, montant estimé pour Q* (prix × Q*), état (« Utilisé » verrouillé ou modifiable).
- Filtres : combobox MP + combobox fournisseur. Bouton « Nouveau devis ».
- Supprimer : `delete devis` (le serveur refuse si utilisé → afficher le message).

### B6bis. Ajouter / modifier un devis — `/gerant/devis/nouveau`, `/:id/modifier` (Devis-Form, Devis-Edit)
- Champs : fournisseur actif (combobox), matière première active (combobox, MP uniquement), date, prix unitaire > 0,
  délai entier ≥ 0. Encart calculé : « Montant estimé pour Q* = … DT ».
- Un devis utilisé dans une commande s'ouvre en lecture seule avec un encart explicatif (RG09).

### B7. Comparer et commander — `/gerant/commander` (Comparer-Commander), paramètre `?produit=id`
- Choix de la MP (combobox) → carte de synthèse : stock, PC, Q*, état, couverture.
- Avertissement si une commande est déjà en attente pour cette MP (`commande_en_cours`).
- **Tableau comparatif** des devis de la MP (fournisseurs actifs) : fournisseur, prix unitaire, délai,
  livraison prévue (aujourd'hui + délai), montant pour la quantité ; badges « Moins cher » et « Plus rapide » ;
  le moins cher est présélectionné (sélection par bouton radio sur la ligne).
- Quantité : par défaut Q*, entier > 0 ; montant total recalculé en direct.
- « Passer la commande » → confirmation → `rpc('passer_commande')` → toast + lien vers la commande.
- Aucun devis : état vide « Aucun devis pour cette matière » + bouton « Ajouter un devis ».

### B8. Commandes — `/gerant/commandes` (Commandes)
- Onglets : Toutes / En attente / Reçues / Annulées (avec compteurs) + recherche.
- Tableau : n° (CMD-xxx), MP · fournisseur, quantité, montant, date, livraison prévue, état (badge, « En retard · N j »).
- Action « Annuler » sur les commandes en attente (`rpc('annuler_commande')`, confirmation).

### B8bis. Détail d'une commande — `/gerant/commandes/:id` (Commande-Detail)
- Récapitulatif (MP, fournisseur, devis, quantité, prix, montant, dates) et **frise d'avancement** :
  Commande passée → Livraison prévue → Facture reçue (ou Annulée).
- Si reçue : bloc facture fournisseur (n°, date, montants). Si en attente : bouton « Annuler la commande ».

### B9. Paramètres de calcul — `/gerant/parametres` (Parametres-Calcul)
- Liste des MP actives ; pour la MP choisie : S (coût de commande, DT > 0), H (coût de détention, DT > 0),
  L (délai, jours ≥ 0), j (jours de sécurité ≥ 0), période d'analyse (7–365, défaut 90).
- Résultats actuels affichés : Q*, PC (recalculés automatiquement par le serveur après enregistrement).
- `update produit` (paramètres uniquement) → relire le produit et afficher les nouveaux Q*/PC.

### B10. Quantité à commander — `/gerant/calcul` (Calcul-Detail)
- Choix de la MP → `rpc('simuler_calcul', { p_id_produit })` : détail pas à pas avec formules
  (d = total / N, D = d × 365, Q* = ⌈√(2DS/H)⌉, SS = d × j, PC = ⌈d × L + SS⌉, coût annuel).
- Comparaison stock / PC et état ; si en alerte : bouton « Commander Q* unités » → B7.
- **Simulation** : saisie d'une autre période → second appel avec `p_periode`, résultats côte à côte, sans enregistrement.
- Messages : « Historique insuffisant », « Paramètres de calcul incomplets » (lien vers B9).

### B11. Statistiques — `/gerant/statistiques` (Statistiques)
- Période (onglets 3 mois / 6 mois / 12 mois).
- Sections : ventes par mois (barres), consommations par MP, valeur du stock (MP / articles),
  **analyse ABC** (`v_analyse_abc` : tableau + répartition A/B/C), **évaluation des fournisseurs**
  (`v_evaluation_fournisseurs`), meilleurs articles vendus.
- Boutons **Exporter en PDF** et **Exporter en Excel** (contenu de la page, titre, date, période).

### B12. Utilisateurs — `/gerant/utilisateurs` (Utilisateurs)
- Comptes chef magasin uniquement : nom, e-mail, téléphone, dernière connexion, statut, mot de passe provisoire en attente.
- Recherche + onglets Actifs / Inactifs. Bouton « Nouveau chef magasin ».

### B12bis. Fiche utilisateur — `/gerant/utilisateurs/:id` (Utilisateur-Detail)
- Identité, coordonnées, informations du compte ; actions : Modifier, **Réinitialiser le mot de passe**,
  Désactiver / Supprimer, Réactiver (Edge Function `gerer-comptes`).
- Onglet **Activité** : journal du chef (`journal_activite` filtré), compteurs.
- Mot de passe provisoire affiché une seule fois dans une fenêtre avec « Copier ».

### B12ter. Créer / modifier un chef magasin — `/gerant/utilisateurs/nouveau`, `/:id/modifier` (Utilisateur-Form, Utilisateur-Edit)
- Création : e-mail, nom, prénom, téléphone, date de naissance, adresse, ville, code postal → `gerer-comptes` / `creer`
  → fenêtre du mot de passe provisoire.
- Modification : `update utilisateur` pour l'identité et les coordonnées ; e-mail via `modifier_email`.

### B13. Activité des chefs — `/gerant/activite-chefs` (Activite-Chefs)
- Journal de tous les chefs magasin : filtre par chef (combobox), onglets par domaine, période ; compteurs par chef.

### B14. Sauvegarde — `/gerant/sauvegarde` (Sauvegarde)
- Explication (contenu de la sauvegarde, à conserver hors de la plateforme, restauration hors application).
- Bouton « Télécharger la sauvegarde » → `sauvegarder-donnees` → fichier JSON ; dernière sauvegarde
  (dernière action `SAUVEGARDE` du journal).

---

## C. Chef magasin

### C1. Tableau de bord — `/chef` (Dashboard-Chef)
- Titre « Bonjour {prénom} » + actions rapides (Nouveau mouvement, Nouvelle demande).
- Indicateurs : commandes à réceptionner, demandes en attente, produits en alerte, factures du mois.
- Cartes cliquables des **commandes à réceptionner** et des **demandes en attente**, alertes de stock,
  derniers mouvements.

### C2. Produits — `/chef/produits` (Produits)
- Onglets **Matières premières / Articles** + recherche + onglets Actifs / Inactifs. Bouton « Nouveau produit ».
- Tableau MP : code, désignation, unité, stock, PC, état. Articles : code, désignation, stock, seuil, prix de vente, état.
- Actions : voir, modifier, supprimer ou désactiver (`supprimer_ou_desactiver('produit', id)`), réactiver.

### C3. Fiche produit — `/chef/produits/:id` (Produit-Detail)
- Indicateurs (stock, PC ou seuil, Q* ou prix de vente, valeur), **courbe d'évolution du stock**,
  bilan par motif (entrées / sorties), **journal des mouvements** avec colonne « stock après ».

### C3bis. Ajouter / modifier un produit — `/chef/produits/nouveau`, `/:id/modifier` (Produit-Form, Produit-Edit)
- Ajout : type (MP / Article, onglets), code unique, désignation, unité, **stock initial** ;
  article : prix de vente > 0 et seuil minimum entier → `rpc('creer_produit')`.
  Encart : « Les paramètres de calcul des matières premières sont réglés par le gérant. »
- Modification : type et stock verrouillés ; `update produit` (désignation, unité, prix, seuil).

### C4. Mouvements — `/chef/mouvements` (Mouvements)
- Onglets **Matières premières / Articles** ; résumé sur 30 jours (entrées, sorties, par motif).
- Filtres : produit (combobox) + motif (onglets) + période. Tableau paginé : date et heure, produit, type (↑/↓), quantité,
  motif (badge), utilisateur, badge **« Auto »** pour Réception fournisseur et Vente.
- Bouton « Nouveau mouvement ».

### C5. Nouveau mouvement — `/chef/mouvements/nouveau` (Mouvement-Form, Mouvement-Edit = même écran, état rempli)
- Choix du produit (combobox) → motif déduit et affiché (MP : sortie « Consommation atelier » ;
  article : entrée « Production atelier »).
- Quantité entière > 0 ; **aperçu stock avant → après** ; refus en direct si sortie > stock.
- Alerte si le stock après atteint le PC (MP) ou le seuil (article).
- `rpc('enregistrer_mouvement')` → toast avec le nouveau stock (+ alerte si `en_alerte`).
- Encart : « Les réceptions et les ventes sont enregistrées automatiquement par les factures. »
- Un mouvement enregistré **n'est jamais modifiable**.

### C6. Inventaire — `/chef/inventaire` (Inventaire)
- Onglets MP / Articles ; tableau : produit, stock enregistré, **quantité comptée** (champ), écart (coloré).
- « Valider l'inventaire » → fenêtre récapitulative des ajustements → confirmation →
  `rpc('enregistrer_inventaire', { p_lignes })` (lignes saisies uniquement) → toast « n ajustement(s) ».
- Aucun écart : « Aucun ajustement nécessaire ».

### C7. Factures fournisseur — `/chef/factures-fournisseur` (Factures-Fournisseur)
- Encart en haut : **commandes à réceptionner** (EN_ATTENTE) en cartes cliquables (badge retard).
- Tableau des factures : n°, commande, MP, fournisseur, date, quantité, montant.

### C7bis. Saisir une facture fournisseur — `/chef/factures-fournisseur/nouvelle?commande=id` (Facture-Fournisseur-Form)
- Rappel de la commande (MP, fournisseur, quantité et prix attendus, montant attendu).
- Champs : n° de facture, date, quantité, prix unitaire, montant total ; **contrôle en direct** ✓ / ✗ à côté de chaque valeur.
- `rpc('saisir_facture_fournisseur')` : conforme → toast « Facture enregistrée, nouveau stock : … » ;
  non conforme → encart rouge listant les écarts (champ, attendu, saisi), rien n'est enregistré.

### C8. Clients — `/chef/clients` (Clients)
- Tableau : nom, téléphone, adresse, nombre de demandes, total facturé, statut. Recherche + Actifs / Inactifs.
- Ajout et modification en **fenêtre** (Client-Form, Client-Edit) : nom obligatoire, téléphone 8 chiffres, adresse.
- Supprimer ou désactiver (`supprimer_ou_desactiver('client', id)`).

### C9. Demandes — `/chef/demandes` (Demandes)
- Onglets Toutes / En attente / Facturées / Annulées. Tableau : n°, client, canal, date, nb d'articles, montant, état.
- Actions : « Établir la facture » (en attente), modifier, annuler (`rpc('annuler_demande')`), ou lien vers la facture.

### C9bis. Nouvelle demande / modifier — `/chef/demandes/nouvelle`, `/:id/modifier` (Demande-Form, Demande-Edit)
- Client actif (combobox), canal (onglets Téléphone / Fax / Sur place), date.
- **Lignes dynamiques** : article (combobox, articles actifs, un article déjà choisi n'est plus proposé),
  quantité, prix unitaire repris de la fiche (lecture seule), sous-total ; ajout et retrait de lignes ; total.
- Indication du stock disponible par ligne (information seulement : le stock est vérifié à la facturation).
- `rpc('enregistrer_demande')` / `rpc('modifier_demande')`.

### C10. Factures client — `/chef/factures-client` (Factures-Client)
- Indicateurs (nombre et total des factures), encart **« Demandes à facturer »** (cartes cliquables).
- Tableau : n° (FC-AAAA-NNNN), client, date, montant, actions (voir / imprimer).

### C10bis. Établir une facture — `/chef/factures-client/nouvelle?demande=id` (Facture-Client-Form)
- Récapitulatif : client, lignes, **stock disponible par ligne** (✓ / ✗), total.
- `rpc('etablir_facture_client')` : `ok: true` → toast avec le numéro, alertes de seuil éventuelles,
  bouton « Imprimer » ; `ok: false` → encart des articles manquants (demandé / disponible), la demande reste en attente.
- Mention : paiement comptant, facture réputée payée.

### C10ter. Facture imprimable — `/chef/factures-client/:id/imprimer` (Facture-Print)
- Page A4 sans menu : en-tête NBM, n° et date, client, tableau des lignes, total, **montant en lettres**
  (« Neuf mille cent soixante-dix dinars »), mention « Payée comptant ». Bouton « Imprimer » (`window.print()`),
  styles `@media print`.

---

## D. Récapitulatif des routes

| Route | Écran | Profil |
|---|---|---|
| `/connexion` | A1 | public |
| `/changer-mot-de-passe` | A2 | connecté |
| `/gerant` | B1 | G |
| `/gerant/stock/matieres`, `/gerant/stock/articles` | B2, B3 | G |
| `/gerant/fournisseurs[/nouveau\|/:id\|/:id/modifier]` | B4, B5 | G |
| `/gerant/devis[/nouveau\|/:id/modifier]` | B6 | G |
| `/gerant/commander` | B7 | G |
| `/gerant/commandes[/:id]` | B8 | G |
| `/gerant/parametres`, `/gerant/calcul`, `/gerant/statistiques` | B9–B11 | G |
| `/gerant/utilisateurs[/nouveau\|/:id\|/:id/modifier]` | B12 | G |
| `/gerant/activite-chefs`, `/gerant/sauvegarde` | B13, B14 | G |
| `/gerant/compte`, `/gerant/activite` | A3, A4 | G |
| `/chef` | C1 | C |
| `/chef/produits[/nouveau\|/:id\|/:id/modifier]` | C2, C3 | C |
| `/chef/mouvements[/nouveau]`, `/chef/inventaire` | C4–C6 | C |
| `/chef/factures-fournisseur[/nouvelle]` | C7 | C |
| `/chef/clients`, `/chef/demandes[/nouvelle\|/:id/modifier]` | C8, C9 | C |
| `/chef/factures-client[/nouvelle\|/:id/imprimer]` | C10 | C |
| `/chef/compte`, `/chef/activite` | A3, A4 | C |

Toute route d'un autre profil redirige vers le tableau de bord de l'utilisateur ; une route inconnue affiche une page 404 sobre.
