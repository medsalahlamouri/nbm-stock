# Contrat back-end Supabase — NBM Stock

État vérifié le 17/11/2026 : projet `gestion-stock` actif (PostgreSQL 17, région Paris),
13 migrations, 12 tables (RLS activée partout), 4 vues, 30 fonctions, 16 déclencheurs,
2 Edge Functions, bucket `photos`. **Le back-end est terminé : ne rien y modifier.**

---

## 1. Connexion

Pas de fichier d'environnement : les deux valeurs publiques sont écrites dans le code.

```js
// src/config/supabase.js
export const SUPABASE_URL = 'https://jwsbmosnzhetgapyoqns.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dbUjh-iGuyq328b70rAliQ_f9J4G6Pa'

// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/config/supabase'
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
```

La clé *publishable* est publique par conception : la sécurité repose sur Supabase Auth (JWT) et la RLS.
La clé `service_role` n'est **jamais** utilisée ni stockée dans ce dépôt.

---

## 2. Authentification (UC01)

| Étape | Appel |
|---|---|
| Connexion | `supabase.auth.signInWithPassword({ email, password })` |
| Enregistrer la connexion | `supabase.rpc('enregistrer_connexion')` → `{ profil, nom, prenom, doit_changer_mdp }`. Erreur « Compte désactivé : contactez le gérant » → `signOut()` + message |
| Mot de passe provisoire | si `doit_changer_mdp` : `supabase.auth.updateUser({ password })` puis `supabase.rpc('confirmer_changement_mdp')` |
| Changer son mot de passe (Mon compte) | `supabase.auth.updateUser({ password })` |
| Déconnexion | `supabase.auth.signOut()` |
| Session | `supabase.auth.getSession()` + `onAuthStateChange` |

- Message en cas d'échec de connexion : **« E-mail ou mot de passe incorrect. »** (sans préciser lequel).
- Pas d'inscription (désactivée côté serveur), **pas de « mot de passe oublié » par e-mail** :
  afficher « Mot de passe oublié ? Adressez-vous au gérant, qui vous remettra un mot de passe provisoire. »
- Profils : `GERANT`, `CHEF_MAGASIN`. Fonctions utiles : `rpc('profil_courant')` → texte.

---

## 3. Tables (lecture via `supabase.from(...)`)

`!` = obligatoire. Clés étrangères utilisables dans les `select` imbriqués de supabase-js.

| Table | Colonnes |
|---|---|
| `utilisateur` | id_utilisateur uuid!, nom!, prenom!, email!, telephone, date_naissance, adresse, ville, code_postal, photo, profil! (GERANT / CHEF_MAGASIN), actif!, doit_changer_mdp!, date_creation!, derniere_connexion |
| `journal_activite` | id_journal!, id_utilisateur uuid!, date_heure!, action!, objet!, detail |
| `produit` | id_produit!, code! (unique), designation!, type! (MP / ARTICLE), unite!, quantite_stock!, prix_vente, seuil_minimum, cout_commande (S), cout_detention (H), delai_livraison (L), jours_securite (j), quantite_economique (Q*), point_commande (PC), actif!, periode_analyse! (7 à 365, défaut 90) |
| `fournisseur` | id_fournisseur!, raison_sociale!, adresse, telephone (8 chiffres), email, actif! |
| `devis` | id_devis!, id_fournisseur!, id_produit! (MP), date_devis!, prix_unitaire! (> 0), delai_livraison! (≥ 0) |
| `commande_fournisseur` | id_commande!, id_devis!, id_utilisateur!, date_commande!, quantite! (> 0), etat! (EN_ATTENTE / RECUE / ANNULEE) |
| `facture_fournisseur` | id_facture_f!, id_commande! (unique), numero!, date_facture!, quantite!, prix_unitaire!, montant_total! |
| `client` | id_client!, nom!, telephone (8 chiffres), adresse, actif! |
| `demande_client` | id_demande!, id_client!, date_demande!, canal! (TELEPHONE / FAX / SUR_PLACE), etat! (EN_ATTENTE / FACTUREE / ANNULEE) |
| `ligne_demande` | id_demande!, id_produit! (ARTICLE), quantite! (> 0), prix_unitaire! |
| `facture_client` | id_facture_c!, id_demande! (unique), numero! (FC-AAAA-NNNN), date_facture!, montant_total! |
| `mouvement_stock` | id_mouvement!, id_produit!, date_mouvement!, type! (ENTREE / SORTIE), quantite! (> 0), motif!, id_utilisateur! |

Motifs de mouvement : `Stock initial`, `Réception fournisseur`, `Production atelier` (entrées) ;
`Consommation atelier`, `Vente` (sorties) ; `Inventaire` (entrée ou sortie).
Les mouvements `Réception fournisseur` et `Vente` sont créés par les factures : badge **« Auto »**.

Exemples de lectures imbriquées :

```js
supabase.from('commande_fournisseur')
  .select('*, devis(*, fournisseur(id_fournisseur, raison_sociale), produit(id_produit, code, designation, unite)), facture_fournisseur(*)')
  .order('date_commande', { ascending: false })

supabase.from('demande_client')
  .select('*, client(id_client, nom, telephone), ligne_demande(*, produit(code, designation, unite)), facture_client(*)')
```

---

## 4. Vues (lecture seule)

| Vue | Colonnes | Usage |
|---|---|---|
| `v_etat_stock` | id_produit, code, designation, type, unite, quantite_stock, actif, seuil (PC pour MP, seuil min. pour article), quantite_economique, prix_vente, valeur_stock, consommation_90j, ventes_90j, production_90j, couverture_jours, en_alerte, commande_en_cours, etat | Stock MP / articles, alertes, tableaux de bord, comparer et commander |
| `v_commandes_retard` | id_commande, date_commande, quantite, delai_livraison, date_livraison_prevue, jours_retard, id_produit, designation, id_fournisseur, raison_sociale | Badge « En retard · N j », tableau de bord, menu (compteur) |
| `v_evaluation_fournisseurs` | id_fournisseur, raison_sociale, actif, commandes_recues, delai_annonce_moyen, delai_reel_moyen, retard_moyen | Fiche fournisseur, statistiques |
| `v_analyse_abc` | id_produit, code, designation, quantite_consommee, dernier_prix, valeur, rang, pourcentage, pourcentage_cumule, classe (A/B/C) | Statistiques |

Valeurs de `etat` dans `v_etat_stock` et badges associés :

| `etat` | Libellé | Ton du badge |
|---|---|---|
| `SUFFISANT` | Suffisant | `ok` (vert) |
| `A_COMMANDER` | À commander | `danger` (rouge brique) |
| `COMMANDE_EN_COURS` | Commande en cours | `info` (bleu ardoise) |
| `A_PRODUIRE` | À produire | `warn` (ocre) |

Les produits désactivés ont `actif = false` : les exclure des listes de travail, les montrer avec le filtre « Inactifs ».

---

## 5. Fonctions RPC (`supabase.rpc(nom, params)`)

Toutes vérifient le profil de l'appelant et s'exécutent en une transaction.
Les erreurs arrivent dans `error.message`, **en français**, prêtes à être affichées.

### Comptes et connexion
| Fonction | Paramètres | Retour | Profil |
|---|---|---|---|
| `enregistrer_connexion` | — | `{ profil, nom, prenom, doit_changer_mdp }` | tous |
| `confirmer_changement_mdp` | — | — | tous |
| `profil_courant` / `est_gerant` / `est_chef` | — | texte / booléen | tous |

### Achats (gérant)
| Fonction | Paramètres | Retour |
|---|---|---|
| `passer_commande` | `p_id_devis`, `p_quantite` | id de la commande créée (EN_ATTENTE) ; met aussi à jour L de la MP |
| `annuler_commande` | `p_id_commande` | — (refus si la commande n'est pas en attente) |
| `simuler_calcul` | `p_id_produit`, `p_periode` (optionnel, 7–365) | `{ periode, total_consomme, d, D, S, H, L, j, Q, SS, PC, cout_annuel, stock, en_alerte }` ou `{ periode, total_consomme, message: 'Historique insuffisant' \| 'Paramètres de calcul incomplets' }` |

### Réception et ventes (chef magasin)
| Fonction | Paramètres | Retour |
|---|---|---|
| `saisir_facture_fournisseur` | `p_id_commande`, `p_numero`, `p_date`, `p_quantite`, `p_prix_unitaire`, `p_montant_total` | `{ conforme: true, id_facture, nouveau_stock }` ou `{ conforme: false, ecarts: [{ champ, attendu, saisi }] }` (rien n'est enregistré) |
| `enregistrer_demande` | `p_id_client`, `p_canal`, `p_date`, `p_lignes` = `[{ id_produit, quantite }]` | id de la demande. Le prix est repris de la fiche article ; un article ne peut figurer qu'une fois |
| `modifier_demande` | `p_id_demande`, `p_canal`, `p_lignes` | — (demande en attente uniquement) |
| `annuler_demande` | `p_id_demande` | — (demande en attente uniquement) |
| `etablir_facture_client` | `p_id_demande` | `{ ok: true, id_facture, numero, montant_total, alertes: [{ id_produit, designation, stock, seuil }] }` ou `{ ok: false, manquants: [{ id_produit, designation, demande, disponible }] }` |

### Stock (chef magasin)
| Fonction | Paramètres | Retour |
|---|---|---|
| `creer_produit` | `p_code`, `p_designation`, `p_type` (MP/ARTICLE), `p_unite`, `p_stock_initial` (défaut 0), `p_prix_vente` (article), `p_seuil_minimum` (article) | id du produit ; crée le mouvement « Stock initial » |
| `enregistrer_mouvement` | `p_id_produit`, `p_quantite` | `{ nouveau_stock, en_alerte, motif }`. MP → sortie « Consommation atelier » (refus si stock insuffisant) ; article → entrée « Production atelier » |
| `enregistrer_inventaire` | `p_lignes` = `[{ id_produit, quantite_comptee }]` | `{ ajustements }` (nombre de mouvements « Inventaire » créés) |

### Référentiels
| Fonction | Paramètres | Retour |
|---|---|---|
| `supprimer_ou_desactiver` | `p_objet` (`'fournisseur'` gérant ; `'client'`, `'produit'` chef), `p_id` | `'SUPPRIME'` ou `'DESACTIVE'` |

Réactiver un fournisseur, un client ou un produit : `update ... set actif = true`.

---

## 6. Écritures directes autorisées (API de données)

| Table | Gérant | Chef magasin |
|---|---|---|
| `fournisseur` | insert, update | — |
| `devis` | insert, update, delete (refusés par le serveur si le devis est utilisé dans une commande) | — |
| `client` | — | insert, update |
| `produit` | update des **paramètres de calcul** des MP : `cout_commande`, `cout_detention`, `delai_livraison`, `jours_securite`, `periode_analyse` (Q* et PC sont recalculés automatiquement) | update de `designation`, `unite`, `prix_vente`, `seuil_minimum`, `actif` (jamais le stock, le type ni les paramètres) |
| `utilisateur` | update de sa ligne et des lignes des chefs (identité, coordonnées) | update de sa propre ligne (sauf e-mail, profil, actif) |

Tout le reste se fait par RPC ou Edge Function. Le journal d'activité est alimenté automatiquement.

---

## 7. Edge Functions (gérant uniquement)

```js
const { data, error } = await supabase.functions.invoke('gerer-comptes', { body: { action: 'creer', ... } })
// En cas d'erreur HTTP, le message est dans le corps : await error.context.json() → { erreur }
```

### `gerer-comptes`
| `action` | Champs du corps | Réponse |
|---|---|---|
| `creer` | `email`, `nom`, `prenom`, `telephone`, `date_naissance`, `adresse`, `ville`, `code_postal` | `{ id_utilisateur, mot_de_passe_provisoire }` |
| `reinitialiser_mdp` | `id_utilisateur` | `{ mot_de_passe_provisoire }` |
| `modifier_email` | `email`, `id_utilisateur` (absent = le gérant lui-même) | `{ ok: true }` |
| `supprimer_ou_desactiver` | `id_utilisateur` | `{ resultat: 'SUPPRIME' \| 'DESACTIVE' }` |
| `reactiver` | `id_utilisateur` | `{ ok: true }` |

Le **mot de passe provisoire** est affiché une seule fois dans une fenêtre, avec un bouton « Copier »
et la consigne de le remettre au chef magasin.

### `sauvegarder-donnees`
Sans corps. Renvoie un JSON `{ application, date, tables: { utilisateur: [...], ... } }`
→ le proposer en téléchargement : `sauvegarde-nbm-AAAA-MM-JJ-HH-MM-SS.json`.

---

## 8. Storage — photos de profil

- Bucket **privé** `photos`, un dossier par utilisateur : `photos/<id_utilisateur>/avatar.<ext>`.
- Chacun écrit dans son dossier ; le gérant peut lire toutes les photos.
- Envoi : `supabase.storage.from('photos').upload(\`${uid}/avatar.${ext}\`, fichier, { upsert: true })`,
  puis enregistrer le chemin dans `utilisateur.photo`.
- Affichage : `createSignedUrl(chemin, 3600)` (bucket privé). Sans photo : initiales sur fond sombre.

---

## 9. Droits de lecture (RLS)

- Toutes les tables métier : lecture pour le gérant et le chef magasin.
- `utilisateur` et `journal_activite` : chacun voit sa ligne / ses opérations ; le gérant voit tout.
- Un utilisateur non connecté ne voit rien.

---

## 10. Données actuelles

La base contient un **jeu de test réduit** (9 produits, 3 fournisseurs, 8 devis, 2 commandes,
4 clients, 6 demandes, 5 factures client, 391 mouvements). La maquette affiche une simulation plus riche.
Une simulation de 6 mois pourra être chargée plus tard : l'interface doit fonctionner **quel que soit le volume**
(pagination, états vides).
