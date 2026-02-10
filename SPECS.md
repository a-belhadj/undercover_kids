# Undercover Kids - Specifications Techniques et Fonctionnelles

## 1. Vue d'ensemble

**Undercover Kids** est une Progressive Web App (PWA) adaptee aux enfants de 3 a 6 ans, inspiree du jeu de societe "Undercover". Au lieu de mots, les joueurs recoivent des **emojis** (ou des images) qu'ils doivent decrire oralement. L'objectif est de demasquer l'espion (undercover) qui a recu un emoji different mais similaire.

**URL de production** : https://a-belhadj.github.io/undercover_kids/

### Principes directeurs

- **Zero lecture requise** : toute l'interface repose sur des icones, emojis et codes couleur
- **Un seul appareil partage** : le telephone/tablette circule entre les joueurs
- **100% offline** : aucun serveur, tout fonctionne dans le navigateur
- **Installable** : PWA avec Service Worker pour fonctionner hors-ligne
- **Portrait uniquement** : optimise pour le mode portrait

---

## 2. Regles du jeu

### 2.1 Joueurs

- **Minimum** : 3 joueurs
- **Maximum** : 16 joueurs
- Chaque joueur entre un prenom (max 15 caracteres)
- Chaque joueur se voit attribuer un avatar emoji et une couleur de fond

### 2.2 Roles

| Role | Description | Emoji |
|------|-------------|-------|
| **Civil** | Recoit l'emoji principal. Majorite des joueurs. | Emoji de la paire (civil) |
| **Undercover** | Recoit un emoji similaire mais different. Doit se fondre dans le groupe. | Emoji de la paire (undercover) |
| **Mr. White** | Ne recoit aucun emoji (voit un "?"). Doit bluffer en ecoutant les autres. | `null` (affiche "?") |

### 2.3 Distribution des roles

La distribution est configurable par l'utilisateur via des steppers :

- **Undercover** : 0 a `floor(playerCount / 2) - mrWhiteCount` joueurs (defaut : 1)
- **Mr. White** : 0 a `floor(playerCount / 2) - undercoverCount` joueurs (defaut : 0)
- **Civils** : `playerCount - undercoverCount - mrWhiteCount` (toujours au moins la moitie)
- **Contrainte** : `undercoverCount + mrWhiteCount <= floor(playerCount / 2)`
- **Contrainte** : au moins 1 role special (undercover ou mr. white) si mr. white est a 0, undercover minimum est 1

Le clamping se fait automatiquement quand le nombre de joueurs change. L'undercover est prioritaire sur Mr. White lors du clamping.

### 2.4 Mode facile

Option activable (`easyMode`) qui affiche le nom du role du joueur pendant la phase de revelation ("Tu es Civil !" ou "Tu es Undercover !") en plus de l'emoji. Desactive par defaut.

### 2.5 Deroulement d'une partie

1. **Configuration** (`setup`) : nombre de joueurs, prenoms, avatars, couleurs, nombre d'undercover/Mr. White, mode facile, selection de categories
2. **Distribution secrete** (`reveal`) : chaque joueur consulte son emoji en prive (passage du telephone)
3. **Discussion** (`discussion`) : les joueurs decrivent leur emoji oralement, puis votent a l'oral pour trouver l'espion
4. **Fin** : les joueurs peuvent reveler toutes les cartes, rejouer avec les memes joueurs, ou commencer un nouveau jeu

> **Note** : le vote, l'elimination, la devinette Mr. White et l'ecran de resultat ne sont pas implementes en tant qu'ecrans dedies. Le vote se fait a l'oral entre joueurs pendant la phase de discussion.

---

## 3. Banque d'emojis

### 3.1 Structure des paires

Chaque "carte" du jeu est une **paire d'emojis similaires** appartenant a une categorie. L'un est donne aux civils, l'autre a l'undercover. Une paire peut contenir des caracteres emoji natifs ou des URL d'images (Icons8 CDN).

```typescript
interface EmojiPair {
  id: string;
  category: string;
  civil: string;        // Emoji natif ou URL d'image
  undercover: string;   // Emoji natif ou URL d'image
  civilLabel: string;   // Label textuel francais
  undercoverLabel: string;
}
```

### 3.2 Categories (13)

| ID | Label | Icone | Nombre de paires | Type |
|----|-------|-------|-----------------|------|
| `animals` | Animaux | 🐾 | 20 | Emoji natif |
| `fruits` | Fruits & Legumes | 🍎 | 16 | Emoji natif |
| `vehicles` | Vehicules | 🚗 | 15 | Emoji natif |
| `food` | Nourriture | 🍕 | 16 | Emoji natif |
| `nature` | Nature | 🌿 | 15 | Emoji natif |
| `objects` | Objets | 🎒 | 16 | Emoji natif |
| `heroes` | Super-Heros | 🦸 | 16 | URL Images (Icons8) |
| `cartoons` | Dessins animes | 🎬 | 7 | URL Images (Icons8) |
| `clothes` | Vetements | 👗 | 13 | Emoji natif |
| `music` | Musique | 🎵 | 10 | Emoji natif |
| `house` | Maison | 🏠 | 12 | Emoji natif |
| `emotions` | Emotions | 😊 | 15 | Emoji natif |
| `body` | Corps humain | 🫀 | 12 | Emoji natif |

**Total : 175 paires**

Les images des categories `heroes` et `cartoons` proviennent du CDN Icons8 (`https://img.icons8.com/color/96/...`).

### 3.3 Gestion des paires

- Chaque paire peut etre activee/desactivee individuellement (persiste dans localStorage)
- Activation/desactivation par categorie entiere
- Bouton "Tout activer" pour reinitialiser
- **Partage de configuration** : encodage binaire des paires activees/desactivees en chaine hexadecimale de 44 caracteres (1 bit par paire, MSB-first par octet)
- Import de configuration depuis une chaine hexadecimale

### 3.4 Selection de categories pour une partie

- **Mode aleatoire** : aucune categorie selectionnee = pioche dans toutes les paires activees
- **Selection simple** : cliquer sur une categorie la selectionne seule
- **Multi-selection** : possible via les toggles
- Les categories dont toutes les paires sont desactivees sont grisees

---

## 4. Architecture Technique

### 4.1 Stack

| Technologie | Version | Usage |
|------------|---------|-------|
| **React** | 19.2.0 | UI / composants |
| **TypeScript** | ~5.9.3 | Typage strict (ES2022) |
| **Vite** | 7.3.1 | Build & dev server |
| **Zustand** | 5.0.11 | State management |
| **vite-plugin-pwa** | 1.2.0 | Service Worker & manifest |
| **CSS Modules** | (built-in Vite) | Styles scopes par composant |
| **Vitest** | 4.0.18 | Tests unitaires (jsdom) |
| **@testing-library/react** | 16.3.2 | Tests de composants |
| **ESLint** | 9.39.1 | Linting |

### 4.2 Structure du projet

```
undercover/
├── .github/workflows/ci-cd.yml   # Pipeline CI/CD
├── index.html                     # Point d'entree HTML (lang="fr")
├── Makefile                       # Commandes raccourcies
├── package.json                   # undercover-kids v1.0.0
├── vite.config.ts                 # Config Vite + PWA + Vitest
├── tsconfig.json                  # References app + node configs
├── tsconfig.app.json              # ES2022, strict, react-jsx
├── tsconfig.node.json             # ES2023, pour vite.config.ts
├── SPECS.md
├── README.md
│
├── public/
│   ├── favicon.svg
│   ├── icon-192.png
│   └── icon-512.png
│
└── src/
    ├── main.tsx                   # Point d'entree React 19 (StrictMode)
    ├── App.tsx                    # Routeur par phase + gestion history
    │
    ├── types/
    │   └── game.ts                # Types, interfaces, constantes
    │
    ├── data/
    │   ├── emojiPairs.ts          # 13 categories + 175 paires
    │   └── emojiPairs.test.ts
    │
    ├── logic/
    │   ├── roles.ts               # Distribution et assignation des roles
    │   ├── roles.test.ts
    │   ├── gameEngine.ts          # Selection de paire + creation joueurs
    │   └── gameEngine.test.ts
    │
    ├── store/
    │   ├── gameStore.ts           # Zustand store global
    │   └── gameStore.test.ts
    │
    ├── lib/
    │   ├── storage.ts             # Persistance localStorage
    │   ├── storage.test.ts
    │   ├── pairConfig.ts          # Encodage/decodage config paires (hex)
    │   └── pairConfig.test.ts
    │
    ├── components/
    │   ├── layout/
    │   │   ├── GameLayout.tsx     # Layout partage (titre + bouton retour)
    │   │   └── GameLayout.module.css
    │   │
    │   ├── ui/
    │   │   ├── Button.tsx         # Bouton reutilisable (4 variantes, 2 tailles)
    │   │   ├── Button.module.css
    │   │   ├── PlayerAvatar.tsx   # Avatar cercle colore + emoji + nom
    │   │   ├── PlayerAvatar.module.css
    │   │   ├── EmojiCard.tsx      # Carte emoji ou image URL
    │   │   └── EmojiCard.module.css
    │   │
    │   └── screens/
    │       ├── HomeScreen.tsx         # Accueil (jouer, parametres, regles)
    │       ├── HomeScreen.module.css
    │       ├── SetupScreen.tsx        # Configuration de partie
    │       ├── SetupScreen.module.css
    │       ├── RevealScreen.tsx       # Revelation secrete par joueur
    │       ├── RevealScreen.module.css
    │       ├── DiscussionScreen.tsx   # Discussion + vote oral + reveal
    │       ├── DiscussionScreen.module.css
    │       ├── Settings.tsx           # Parametres (roster, groupes, paires)
    │       ├── Settings.module.css
    │       ├── PairBrowser.tsx        # Navigateur de paires
    │       └── PairBrowser.module.css
    │
    ├── styles/
    │   ├── global.css             # Variables CSS, reset global
    │   └── animations.css         # Animations globales
    │
    └── test/
        └── setup.ts               # Setup Vitest (@testing-library/jest-dom)
```

### 4.3 PWA

- **Service Worker** via `vite-plugin-pwa` (Workbox)
- **Strategie** : `registerType: 'autoUpdate'`
- **Cache** : `globPatterns: ['**/*.{js,css,html,svg,png}']`
- **Manifest** :
  - `name` : "Undercover Kids"
  - `short_name` : "Undercover"
  - `display` : "standalone"
  - `orientation` : "portrait"
  - `theme_color` : "#6C5CE7"
  - `background_color` : "#FFFFFF"
  - Icones : 192x192 et 512x512 (maskable)
- **Base path** : `/undercover_kids/` en production, `/` en dev
- **Installable** sur l'ecran d'accueil (Android & iOS)
- **100% offline** apres la premiere visite

---

## 5. Modele de donnees

### 5.1 Types principaux

```typescript
type Role = 'civil' | 'undercover' | 'mrwhite';

type GamePhase = 'home' | 'setup' | 'reveal' | 'discussion';

interface Player {
  id: string;              // ID aleatoire 8 caracteres (base36)
  name: string;
  role: Role;
  emoji: string | null;    // null pour Mr. White, emoji ou URL pour les autres
  emojiLabel: string | null;
  avatarEmoji: string;     // Emoji animal (parmi 16)
  avatarColor: string;     // Couleur hex (parmi 16)
}

interface EmojiPair {
  id: string;
  category: string;
  civil: string;
  undercover: string;
  civilLabel: string;
  undercoverLabel: string;
}

interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPair: EmojiPair | null;
  currentPlayerIndex: number;
  undercoverCount: number;
  mrWhiteCount: number;
  easyMode: boolean;
  selectedCategories: string[];
}
```

### 5.2 Types de persistance

```typescript
interface RosterPlayer {
  id: string;              // Date.now().toString(36)
  name: string;
  avatarEmoji: string;
  avatarColor: string;
}

interface PlayerGroup {
  id: string;              // Date.now().toString(36)
  name: string;
  playerIds: string[];     // References vers RosterPlayer.id
}

interface PlayerProfile {
  name: string;
  avatarEmoji: string;
  avatarColor: string;
}
```

### 5.3 Constantes

- **`AVATAR_EMOJIS`** (16) : `🐶 🐱 🐸 🐰 🦊 🐼 🦁 🐧 🐯 🐮 🐷 🐵 🦄 🐲 🦋 🐢`
- **`AVATAR_COLORS`** (16) : `#E17055 #00B894 #6C5CE7 #FD79A8 #FDCB6E #00CEC9 #E84393 #55A3E7 #A29BFE #FF7675 #74B9FF #81ECEC #FAB1A0 #DFE6E9 #B2BEC3 #636E72`

---

## 6. Store Zustand

### 6.1 Etat

Le store global (`useGameStore`) combine `GameState` et `GameActions`. L'etat initial charge les preferences depuis localStorage.

### 6.2 Actions

| Action | Description |
|--------|-------------|
| `setPhase(phase)` | Change la phase du jeu |
| `goHome()` | Reset vers home (preserve undercoverCount, mrWhiteCount, easyMode) |
| `setUndercoverCount(count)` | Met a jour + persiste dans localStorage |
| `setMrWhiteCount(count)` | Met a jour + persiste dans localStorage |
| `setEasyMode(enabled)` | Met a jour + persiste dans localStorage |
| `setSelectedCategory(category \| null)` | Selection simple (null = aleatoire) |
| `toggleCategory(category)` | Ajoute/retire une categorie de la multi-selection |
| `startGame(names, avatarEmojis, avatarColors)` | Pioche une paire, cree les joueurs, sauvegarde les profils, passe en `reveal` |
| `nextReveal()` | Incremente `currentPlayerIndex`, passe en `discussion` si tous reveles |
| `restartWithSamePlayers()` | Re-pioche une paire, recree les joueurs avec memes noms/avatars/couleurs |

---

## 7. Logique de jeu

### 7.1 Distribution des roles (`roles.ts`)

```
getRoleDistribution(playerCount, undercoverCount, mrWhiteCount) → { civil, undercover, mrwhite }
```

- Clampe les roles speciaux pour ne pas depasser `floor(playerCount / 2)`
- Undercover est clampe en priorite, Mr. White recoit le reste
- `civil = playerCount - undercover - mrwhite`

```
assignRoles(playerCount, undercoverCount, mrWhiteCount) → Role[]
```

- Construit le tableau de roles, melange avec **Fisher-Yates**
- Retourne un tableau melange aleatoirement

### 7.2 Selection de paire et creation des joueurs (`gameEngine.ts`)

```
pickPair(categories?, disabledPairIds?) → EmojiPair
```

- Filtre par categories selectionnees (si non vide) et exclut les paires desactivees
- **Fallback** : si le filtre donne 0 resultat, ignore le filtre de paires desactivees
- Selection aleatoire uniforme

```
createPlayers(names, avatarEmojis, avatarColors, pair, undercoverCount, mrWhiteCount) → Player[]
```

- Appelle `assignRoles()` pour obtenir les roles melanges
- Assigne les emojis selon le role : `pair.civil` pour civil, `pair.undercover` pour undercover, `null` pour Mr. White

---

## 8. Ecrans et Navigation

### 8.1 Phases du jeu

```
[HomeScreen] → [SetupScreen] → [RevealScreen] → [DiscussionScreen]
    home           setup           reveal           discussion
```

Le routage est base sur la phase dans le store Zustand. Pas de react-router.

### 8.2 Gestion du bouton retour navigateur

- `history.pushState` a chaque changement de phase (sauf home)
- Le bouton retour ramene a l'ecran d'accueil depuis n'importe quelle phase
- Depuis l'accueil, le bouton retour est "bloque" (re-push de l'etat pour eviter de quitter la PWA)

### 8.3 Detail des ecrans

#### HomeScreen (`home`)

- Logo anime (emoji 🕵️ avec animation `pulse`)
- Titre "Undercover Kids", sous-titre "Trouve l'espion !"
- 3 boutons : "Jouer" (→ setup), "Parametres" (ouvre Settings), "Regles" (ouvre modal)
- **Modal Regles** : carrousel de 5 slides avec navigation :
  1. 🎯 "Chaque joueur recoit une image en secret."
  2. 🕵️ "L'espion a une image differente mais qui ressemble !"
  3. 🗣️ "Decrivez votre image chacun votre tour avec un mot."
  4. 🗳️ "Votez pour eliminer celui que vous pensez etre l'espion !"
  5. 🏆 "Les civils gagnent si l'espion est demasque !"
- Attribution Icons8 en bas de page

#### SetupScreen (`setup`)

- **Stepper nombre de joueurs** : 3 a 16
- **Liste des joueurs** : avatar cliquable (ouvre picker) + champ nom (max 15 car., autoCapitalize)
- **Chargement de groupe** : bouton "Charger" (si des groupes existent), remplit les joueurs depuis le roster
- **Creation de groupe** : bouton "Creer groupe" (si 3+ noms remplis), sauvegarde le groupe et les joueurs dans le roster
- **Stepper Undercover** : min/max dynamiques selon le nombre de joueurs et Mr. White
- **Stepper Mr. White** : min/max dynamiques selon le nombre de joueurs et undercover
- **Toggle Mode facile** : affiche le role pendant la revelation
- **Selection de categories** : bouton "Aleatoire" + grille de 13 categories avec compteur (activees/total)
- **Bouton "C'est parti !"** : desactive si tous les noms ne sont pas remplis
- **Picker d'avatar** : bottom sheet avec grille d'emojis (deja pris = desactives) + grille de couleurs
- Pre-remplissage depuis les profils sauvegardes dans localStorage

#### RevealScreen (`reveal`)

- Affiche le titre "Joueur X/Y" dans le header
- **Avant revelation** :
  - Avatar large du joueur + prenom
  - Message "Retourne le telephone vers toi"
  - Bouton "Voir mon image"
- **Apres revelation (Civil/Undercover)** :
  - `EmojiCard` avec animation `emoji-reveal` (bounce)
  - Label textuel de l'emoji
  - Tag de role (mode facile uniquement) : "Tu es Civil ! 🟢" ou "Tu es Undercover ! 🥷"
  - Sinon : "Memorise bien ton image !"
- **Apres revelation (Mr. White)** :
  - `EmojiCard` avec "?" en mode `mystery`
  - "Tu es Mr. White ! Bluff ! 🎩"
- Bouton "J'ai vu !" passe au joueur suivant

#### DiscussionScreen (`discussion`)

- Instruction : "Decrivez votre image chacun votre tour, puis votez pour trouver l'espion !"
- **Grille des joueurs** : avatars avec badges de compteur de peek
- Indication "Le vote se fait a l'oral entre joueurs"
- **Systeme de peek ("Revoir mon image")** :
  1. Selection du joueur (grille)
  2. Ecran masque (passer le telephone)
  3. **Alarme anti-triche** (1.5s) avant affichage
  4. Revelation de la carte du joueur
- **Alarme anti-triche** :
  - Son sirene via Web Audio API (2 oscillateurs square wave, 600Hz/800Hz alternant toutes les 200ms)
  - Vibration (`navigator.vibrate`)
  - Flash torche camera (Android Chrome, `getUserMedia` + `facingMode: environment`)
  - Flash rouge visuel plein ecran
- **"Voir les cartes"** : affiche la grille de toutes les cartes avec le role de chaque joueur (declenche l'alarme avant)
- **Actions de fin** : "Rejouer" (memes joueurs, nouvelle paire) et "Nouveau jeu" (retour accueil)

### 8.4 Parametres (Settings)

Overlay plein ecran accessible depuis HomeScreen, avec 3 onglets :

#### Onglet "Joueurs" (Roster)

- Liste des joueurs sauvegardes avec avatar, nom, boutons editer/supprimer
- Formulaire d'ajout : nom + picker emoji + picker couleur
- Edition inline (avatar + nom modifiables)
- Suppression en cascade (retire aussi le joueur de tous les groupes)

#### Onglet "Groupes"

- Liste des groupes avec chips des membres
- Creation de groupe : nom + selection de joueurs du roster (min 3, max 16)
- Edition inline (nom + re-selection des joueurs)
- Suppression de groupe

#### Onglet "Paires" (PairBrowser)

- Barre d'outils : "Tout activer", "Partager", compteur activees/total
- **Partage** : generation d'un code hexadecimal de 44 caracteres, bouton "Copier" (clipboard API avec fallback `execCommand`)
- **Import** : champ de saisie + bouton "Importer" avec validation
- Accordeon par categorie : header (icone, label, compteur, chevron), liste de paires avec toggle individuel
- Bouton "Tout activer/desactiver" par categorie
- Mode embarque (dans Settings) ou autonome (overlay complet)

---

## 9. Composants UI

### 9.1 Button

Bouton reutilisable avec :
- **Variantes** : `primary` (violet), `secondary` (gris clair), `danger` (rouge), `success` (vert)
- **Tailles** : `normal`, `large`
- **Options** : `block` (pleine largeur), `icon` (ReactNode affiche a gauche)
- Etend `ButtonHTMLAttributes<HTMLButtonElement>`

### 9.2 PlayerAvatar

Cercle colore avec emoji animal au centre :
- **Tailles** : `small`, `medium`, `large`
- **Options** : `highlighted` (ajoute animation `highlight-ring`), `name` (affiche le nom en dessous), `onClick` (rend cliquable avec `role="button"`)
- Couleur de fond definie par la prop `color`

### 9.3 EmojiCard

Carte affichant un emoji ou une image :
- **Props** : `large` (grande taille), `selectable` (rend cliquable), `selected` (bordure de selection), `mystery` (style mystere pour Mr. White)
- Si l'emoji est une URL (`http://` ou `https://`) : affiche une `<img>`
- Sinon : affiche le caractere emoji dans un `<span>`

### 9.4 GameLayout

Layout partage pour tous les ecrans :
- **Header optionnel** : bouton retour ("←") + titre
- **Contenu** : enveloppe dans un div avec animation `screen-enter` (slide-in 300ms)

---

## 10. Stockage local (localStorage)

Toutes les fonctions de stockage sont dans `src/lib/storage.ts`. Chaque acces est protege par `try/catch` (mode prive, quota depasse, etc.).

| Cle localStorage | Type | Defaut | Usage |
|-----------------|------|--------|-------|
| `undercover-kids-players` | `PlayerProfile[]` | `[]` | Derniers profils de joueurs (noms, avatars, couleurs) |
| `undercover-kids-undercover-count` | `number` | `1` | Nombre d'undercover |
| `undercover-kids-mrwhite-count` | `number` | `0` | Nombre de Mr. White |
| `undercover-kids-disabled-pairs` | `string[]` | `[]` | IDs des paires desactivees |
| `undercover-kids-easy-mode` | `boolean` | `false` | Mode facile active |
| `undercover-kids-roster` | `RosterPlayer[]` | `[]` | Base de joueurs permanente |
| `undercover-kids-groups` | `PlayerGroup[]` | `[]` | Groupes de joueurs nommes |

---

## 11. Encodage de configuration des paires (`pairConfig.ts`)

Systeme de partage compact pour la configuration des paires activees/desactivees :

- **`encodePairConfig(disabledIds: Set<string>): string`** : encode 175 paires en 22 octets (44 caracteres hex). 1 bit par paire (1 = activee, 0 = desactivee), MSB-first par octet.
- **`decodePairConfig(code: string): Set<string> | null`** : decode une chaine hex de 44 caracteres. Retourne `null` si le format est invalide (longueur incorrecte ou caracteres non-hex).

---

## 12. Design et UX

### 12.1 Principes

- **Touch-first** : boutons larges, zones de tap genereuses
- **Pas de texte complexe** : tout est accompagne d'icones/emojis
- **Couleurs vives** mais pas agressives (palette enfantine)
- **Animations douces** : transitions entre ecrans, feedback tactile
- **Portrait uniquement** : `body { position: fixed; width: 100%; }`
- **Pas de scroll bounce** : `overscroll-behavior: none`
- **Pas de selection** : `user-select: none`
- **Boutons** : `transform: scale(0.95)` au press

### 12.2 Variables CSS (design tokens)

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--color-primary` | `#6C5CE7` | Violet - couleur principale |
| `--color-primary-light` | `#A29BFE` | Violet clair |
| `--color-secondary` | `#FD79A8` | Rose |
| `--color-success` | `#00B894` | Vert - civil |
| `--color-danger` | `#E17055` | Rouge corail - undercover |
| `--color-mrwhite` | `#DFE6E9` | Gris clair - Mr. White |
| `--color-bg` | `#FFFFFF` | Fond |
| `--color-surface` | `#F8F9FA` | Surface (cartes, overlays) |
| `--color-text` | `#2D3436` | Texte principal |
| `--color-text-light` | `#636E72` | Texte secondaire |
| `--color-border` | `#E0E0E0` | Bordures |
| `--radius` | `16px` | Rayon de bordure standard |
| `--radius-sm` | `10px` | Rayon de bordure petit |
| `--shadow` | `0 4px 16px rgba(0,0,0,0.10)` | Ombre standard |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.08)` | Ombre legere |
| `--font` | Systeme | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |

### 12.3 Animations

| Classe CSS | Animation | Duree | Usage |
|------------|-----------|-------|-------|
| `.screen-enter` | `screenSlideIn` | 300ms | Transition d'entree des ecrans (slide depuis la droite) |
| `.emoji-reveal` | `emojiBounce` | 500ms | Revelation d'emoji (scale de 0 a 1 avec rebond) |
| `.pulse` | `pulse` | 1.5s (infinite) | Pulsation douce du logo |
| `.highlight-ring` | `ringPulse` | 1.2s (infinite) | Anneau lumineux autour d'un avatar actif |
| `.suspense-dots span` | `dotBounce` | 1.4s (infinite) | Points de suspension animes (3 dots staggeres) |

---

## 13. Tests

### 13.1 Configuration

- **Runner** : Vitest 4.0.18
- **Environnement** : jsdom
- **Setup** : `@testing-library/jest-dom/vitest`
- **CSS** : active dans les tests

### 13.2 Fichiers de test

| Fichier | Lignes | Couverture |
|---------|--------|-----------|
| `src/data/emojiPairs.test.ts` | ~113 | Structure des paires, comptage, unicite, validation URLs |
| `src/logic/roles.test.ts` | ~202 | Distribution mathematique, clamping, shuffle Fisher-Yates |
| `src/logic/gameEngine.test.ts` | ~354 | Selection de paire par categorie, creation joueurs, distributions |
| `src/store/gameStore.test.ts` | ~360 | Toutes les actions du store avec mocks |
| `src/lib/storage.test.ts` | ~349 | Aller-retour localStorage complets |
| `src/lib/pairConfig.test.ts` | ~86 | Encodage/decodage hex, round-trips, validation |

---

## 14. CI/CD

### 14.1 Pipeline GitHub Actions

**Fichier** : `.github/workflows/ci-cd.yml`
**Declencheurs** : push sur `main`, pull requests vers `main`

```
  lint ──────┐
  typecheck ─┤──→ build ──→ deploy (main uniquement)
  test ──────┘
```

| Job | Description | Dependances |
|-----|-------------|-------------|
| `lint` | `npm run lint` (ESLint) | - |
| `typecheck` | `npm run typecheck` (tsc) | - |
| `test` | `npm run test` (Vitest) | - |
| `build` | `npm run build` (tsc + Vite), upload artifact Pages | lint, typecheck, test |
| `deploy` | Deploy sur GitHub Pages | build (main uniquement) |

- Node 20, Ubuntu latest
- lint, typecheck et test tournent en parallele
- Le deploy ne se fait que sur les push `main` (pas les PRs)

### 14.2 Commandes Makefile

| Commande | Action |
|----------|--------|
| `make up` | Serveur de dev (accessible sur le reseau local) |
| `make build` | Build de production |
| `make preview` | Preview du build de production |
| `make lint` | ESLint |
| `make typecheck` | Verification TypeScript |
| `make test` | Tests Vitest |
| `make check` | lint + typecheck + test |
| `make install` | `npm ci` |
| `make clean` | Supprime `dist/` et `node_modules/` |

---

## 15. Contraintes et limites

- **Pas de mode multijoueur reseau** : un seul appareil, passage de main en main
- **Pas de comptes utilisateurs** : jeu anonyme et instantane
- **Pas d'analytics** : respect total de la vie privee
- **Pas de vote in-app** : le vote se fait a l'oral entre joueurs
- **Pas d'ecran d'elimination** : la revelation des cartes se fait manuellement dans DiscussionScreen
- **Pas d'ecran de resultat** : les joueurs decident eux-memes de la fin de partie
- **Pas de devinette Mr. White in-app** : pas d'ecran dedie avec grille de 6 emojis
- **Dependance externe** : les categories heroes et cartoons dependent du CDN Icons8 (pas disponibles offline sans cache prealable)
- **Support navigateurs** : navigateurs modernes (Chrome, Safari, Firefox recents)
