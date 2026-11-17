# Système visuel — maquette « NBM Stock »

Valeurs relevées dans le code de la maquette (17/11/2026). Style : moderne, sobre, professionnel.
Fond clair légèrement chaud, **menu latéral noir**, cartes blanches, boutons principaux noirs,
**touche dorée** (logo, compteurs), badges d'état doux. **Thème sombre** disponible (bouton lune/soleil).

---

## 1. Variables CSS (à reprendre telles quelles)

```css
:root, [data-theme="light"] {
  --bg:#F4F3EF; --surf:#FFFFFF; --surf2:#F8F7F4;
  --line:#E5E3DD; --line2:#D2CFC7; --line3:#EEECE7; --grid:#EAE8E2; --seg:#ECEAE4;
  --ink:#111111; --strong:#111111; --ink2:#2D2D2A; --ink3:#4A4945;
  --muted:#6A6964; --muted2:#8A8984;
  --nbg:#ECEAE5; --nfg:#55544F;          /* neutre */
  --hl:#F3EEE2;                           /* surlignage */
  --side:#0E0E10; --sideline:#0E0E10; --sidetxt:#E6E6E3; --sidemut:#94948F;
  --sideon:#26262A; --sidehi:#FFFFFF; --sideav:#F0EFEB; --sideavt:#111111;
  --okbg:#E4EFE0; --okfg:#2B5A27;         /* succès */
  --dbg:#F7E1DB;  --dfg:#A12F21;          /* danger */
  --wbg:#F5E8CB;  --wfg:#79520E;          /* avertissement */
  --ibg:#E3E9F1;  --ifg:#2B4A6B;          /* information */
  --red:#C9533F; --gold:#C2A066; --gold2:#B4862C; --sand:#CFCBC1;
  --green:#3D7A36; --blue:#5B7A99;
  --dline:#EBD0C8; --dline2:#E2B9AE; --dline3:#D9A497; --dtxt:#5A2A20;
}
[data-theme="dark"] {
  --bg:#0C0C0D; --surf:#161618; --surf2:#1C1C1F;
  --line:#2A2A2E; --line2:#3B3B41; --line3:#222226; --grid:#26262A; --seg:#222226;
  --ink:#F1F0EC; --strong:#F1F0EC; --ink2:#DADAD4; --ink3:#BEBDB7;
  --muted:#9E9D97; --muted2:#7E7D86;
  --nbg:#2A2A2F; --nfg:#C4C3BD; --hl:#2A2720;
  --side:#050506; --sideline:#26262A; --sidetxt:#E0E0DC; --sidemut:#86868F;
  --sideon:#1C1C20; --sidehi:#FFFFFF; --sideav:#F0EFEB; --sideavt:#111111;
  --okbg:#18291A; --okfg:#8CCB85; --dbg:#3A1C18; --dfg:#F09381;
  --wbg:#3A2E15; --wfg:#E5BC6A; --ibg:#1A2533; --ifg:#95B6D9;
  --red:#E2654F; --gold:#C9A86A; --gold2:#D6AA4E; --sand:#4B4B52;
  --green:#5FA556; --blue:#7FA0C2;
  --dline:#4A2A24; --dline2:#5A3028; --dline3:#6A3A30; --dtxt:#F3C1B5;
  color-scheme: dark;
}
```

Relier ces variables aux jetons shadcn/ui (`--background` ← `--bg`, `--card` ← `--surf`,
`--primary` ← `--strong`, `--primary-foreground` ← `--bg`, `--border` ← `--line`,
`--muted-foreground` ← `--muted`, `--destructive` ← `--red`…) et les exposer dans Tailwind.

---

## 2. Typographie

- **Fraunces** (500, 600) : logo, titre de page (h1 30 px, 600, `letter-spacing:-0.02em`, interligne 1.15),
  titre de la connexion (26 px).
- **Inter** (400, 500, 600, 700) : tout le reste.
  - Texte courant 14 px ; texte secondaire 13 px couleur `--muted` ; interligne 1.55.
  - Titre de carte (h2) 16 px, 600.
  - En-têtes de tableau 12 px, 600, MAJUSCULES, `letter-spacing:0.04em`, `--muted`, fond `--surf2`.
  - Libellés de section du menu 11 px, 600, MAJUSCULES, `letter-spacing:0.08em`, `--sidemut`.
  - Indicateurs chiffrés 28 px, 600, `letter-spacing:-0.02em`, `font-variant-numeric: tabular-nums`.
  - Références de documents (CMD-019, FC-2026-0001) : police monospace, 600.

---

## 3. Mise en page

- **Écran connecté** : menu latéral noir à gauche (≈ 260 px, `--side`) + zone principale (`--bg`).
- **En-tête** (hauteur ≥ 60 px, padding `12px 32px`, bordure basse `--line`) :
  fil d'Ariane à gauche (« Accueil / Tableau de bord »), à droite : date du jour en toutes lettres
  (« Vendredi 13 novembre 2026 »), bouton thème, bouton **Alertes** (cloche avec pastille rouge),
  avatar rond noir avec initiales (lien vers Mon compte).
- **Contenu** : `max-width:1280px`, centré, padding `28px 32px 48px`, espacement vertical 22 px.
- **Tête de page** : titre h1 + phrase d'introduction en `--muted` à gauche ; boutons d'action à droite.
- **Grilles** : indicateurs `repeat(auto-fit, minmax(210px, 1fr))`, gap 16 px ;
  blocs `repeat(auto-fit, minmax(min(100%, 460px), 1fr))`, gap 18 px.

### Menu latéral
- Haut : logo 34 px + « NBM Stock » (Fraunces 17 px) + « Nabeul Bois et Meubles » (12 px, `--sidemut`).
- Liens : hauteur 40 px, padding `0 10px`, rayon 9 px, 14 px, icône 16 px, `--sidetxt` à 86 % d'opacité.
- Lien actif : fond `--sideon`, texte `--sidehi`, 500, **trait clair à gauche** (`box-shadow: inset 3px 0 0 var(--sideav)`).
- Compteurs à droite des liens : pastille 20 px, 11 px, 600 — **rouge** (`--red`) pour les retards (gérant),
  **doré** (`--gold2`) pour les éléments à traiter (chef).
- Bas : carte utilisateur (fond `--sideon`, rayon 12 px) : avatar 34 px clair (`--sideav`) avec initiales,
  nom (lien Mon compte), profil, bouton de déconnexion.

**Menu du gérant**
- Tableau de bord
- STOCK : Matières premières · Articles
- ACHATS : Fournisseurs · Devis · Comparer et commander · Commandes (compteur des retards)
- STATISTIQUES : Paramètres de calcul · Quantité à commander · Statistiques
- ADMINISTRATION : Utilisateurs · Activité des chefs · Sauvegarde · Mon activité

**Menu du chef magasin**
- Tableau de bord
- STOCK : Produits · Mouvements · Inventaire
- ACHATS : Factures fournisseur (compteur des commandes à réceptionner)
- VENTES : Clients · Demandes (compteur des demandes en attente) · Factures client
- COMPTE : Mon activité

---

## 4. Composants

| Composant | Style |
|---|---|
| **Carte / section** | fond `--surf`, bordure 1 px `--line`, rayon 14 px, ombre `0 1px 2px rgba(26,24,20,.04)`, padding 22 px, gap 16 px |
| **Carte indicateur** (cliquable) | même carte, padding `18px 20px` ; libellé 13 px `--muted` ; pastille d'icône 34 px rayon 10 px colorée selon le ton ; valeur 28 px ; sous-texte 13 px `--muted` |
| **Bouton principal** | hauteur 40 px, padding `0 16px`, rayon 10 px, fond et bordure `--strong`, texte `--bg`, 14 px, 500, icône 16 px |
| **Bouton secondaire** | même gabarit, fond `--surf`, bordure `--line2`, texte `--ink` |
| **Petit bouton** (dans les listes) | hauteur 32 px, padding `0 10px`, rayon 8 px, 13 px |
| **Bouton-icône** | 38 × 38 px, rayon 10 px, bordure `--line`, fond `--surf` |
| **Champ** | hauteur 42–46 px, padding `0 12px`, rayon 10 px, bordure `--line2`, fond `--surf`, 14 px ; libellé au-dessus 13 px, 600, `--ink2` ; focus : contour 2 px `--ink` |
| **Badge d'état** | hauteur 24 px, padding `0 10px`, rayon 999 px, 12 px, 600 ; couleurs par ton (ci-dessous) |
| **Tableau** | largeur 100 %, en-tête 42 px ; lignes 52 px, 14 px, séparateur `--line3` ; première/dernière colonne padding 22 px ; colonnes numériques alignées à droite ; texte principal en gras + sous-ligne 12 px `--muted` |
| **Pagination** | « lignes 1 à 10 sur N » + « Page p / P » + boutons de pages (page active fond `--strong`) |
| **Onglets** (segmented control) | fond `--seg`, onglet actif fond `--surf` avec ombre `0 1px 3px rgba(26,24,20,.14)`, compteur à côté du libellé |
| **Combobox** | champ de recherche + liste filtrée (insensible aux accents et à la casse), sous-libellé grisé |
| **Encart d'alerte** | rayon 12 px, padding `12px 14px`, fond/texte selon le ton, icône à gauche |
| **Ligne d'alerte** (tableau de bord) | pastille d'icône 40 px rayon 11 px + titre 14 px 600 + détail 13 px `--muted` + badge et bouton à droite |
| **Graphiques** | barres `--strong`, coins arrondis 4 px, valeurs au-dessus, grille pointillée `--grid`, axes 11–12 px `--muted` |

### Tons (badges, pastilles, encarts)

| Ton | Fond / texte | Usage |
|---|---|---|
| `ok` | `--okbg` / `--okfg` | Suffisant, Reçue, Facturée, Actif, Conforme |
| `danger` | `--dbg` / `--dfg` | À commander, En retard, Non conforme, erreurs |
| `warn` | `--wbg` / `--wfg` | À produire, En attente, Prévue aujourd'hui |
| `info` | `--ibg` / `--ifg` | Commande en cours, Auto, informations |
| `neutral` | `--nbg` / `--nfg` | Annulée, Inactif, valeurs neutres |
| `dark` | `--ink` / `--bg` | Mise en avant (« Moins cher », « Plus rapide ») |

---

## 5. Logo (SVG)

```html
<svg width="34" height="34" viewBox="0 0 48 48" aria-hidden="true">
  <rect width="48" height="48" rx="12" fill="var(--bg)"/>
  <rect x="11" y="11" width="7" height="26" rx="2" fill="var(--strong)"/>
  <rect x="30" y="11" width="7" height="26" rx="2" fill="var(--strong)"/>
  <path d="M13.5 15v6M13.5 26v7M32.5 15v8M32.5 28v5" stroke="var(--bg)" stroke-width="0.9" stroke-linecap="round" opacity="0.35"/>
  <path d="M11.6 12.6 Q12.5 11 14.4 11 L16.6 11 Q18 11 18.8 12.2 L36.4 35.4 Q37 37 35.2 37 L32.4 37 Q31 37 30.2 35.8 Z" fill="var(--gold)"/>
</svg>
```

Dans le menu noir : carré `--bg`, montants `--strong`. Sur la page de connexion (64 px) : couleurs inversées
(carré `--strong`, montants `--bg`).

---

## 6. Page de connexion

Fond `--bg` avec halo radial clair en haut et fines lignes verticales (`repeating-linear-gradient` tous les 88 px,
opacité 2,5 %). Au centre : logo 64 px, « NBM » (Fraunces 30 px), « NABEUL BOIS ET MEUBLES » (11 px, espacé) ;
carte de 440 px max (rayon 18 px, ombre `0 18px 48px rgba(26,24,20,.08)`, padding `34px 34px 28px`) :
titre « Connexion », phrase « Utilisez l'adresse e-mail et le mot de passe fournis par le gérant. »,
encart d'erreur, champs e-mail et mot de passe (bouton œil), bouton noir pleine largeur 46 px « Se connecter »,
séparateur, cadenas + « Mot de passe oublié ? Adressez-vous au gérant… ». Pied de page : « Connexion sécurisée ·
accès réservé au personnel de NBM » et « © 2026 Nabeul Bois et Meubles · Gestion de stock, version 1.0 ».
Bouton thème en haut à droite.

---

## 7. Mouvement et ressenti

- Transitions courtes (150–200 ms) sur survol, focus, ouverture des menus et des fenêtres.
- Survol des cartes cliquables : légère élévation de l'ombre et bordure `--line2`.
- Squelettes de chargement aux dimensions des contenus (pas de « page blanche »).
- Toasts de confirmation discrets en bas à droite (succès vert, erreur rouge brique).
- Pas d'animation gratuite : l'interface doit rester calme et lisible.
