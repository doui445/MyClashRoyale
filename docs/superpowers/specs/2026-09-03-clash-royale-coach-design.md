# Clash Royale Coach — Document de conception

*Date : 2026-09-03 · Statut : validé, prêt pour le plan d'implémentation*

## 1. Contexte et objectif

Application qui conseille un joueur de Clash Royale sur **quel deck jouer** et
**quelles cartes améliorer en priorité**, en fonction de ses cartes possédées,
de son palier de trophées actuel et d'un objectif de trophées.

Cas d'usage central : un joueur qui reprend après une longue pause, avec des
cartes sous-développées par rapport à la méta, veut un plan concret — quel deck
jouable tout de suite, quel deck viser, quoi monter et dans quel ordre.

### Historique

Une première tentative (conversation d'un proche non-développeur, résumé dans
`docs/context-conversation-frere.md`) avait produit une stack backend
FastAPI + PostgreSQL + hébergement à IP fixe, sans que les besoins ne soient
réellement pilotés. Ce document repart de zéro sur les besoins et la technique.

### Portée

| Version | Contenu |
|---|---|
| **MVP** | Saisie du tag joueur · affichage profil (cartes/niveaux/trophées) et battlelog · **suggestion de deck** (deck de transition + deck final + ordre de priorité d'upgrade) · historique des suggestions |
| **v2** | Reco d'upgrade budgétée (saisie ponctuelle or/gemmes/jokers) · analyse du battlelog (points faibles, matchups) · scraper méta automatisé |
| **plus tard** | Distribution publique (stores), comptes + sync multi-appareils via BaaS, social/partage de decks |

### Utilisateurs et distribution

- Pour l'instant : **installation privée sur 2 iPhones** (l'auteur + son frère).
- **PWA** installée via Safari (« Sur l'écran d'accueil »). Pas de compte
  développeur Apple, pas de store, coût récurrent 0 €.
- Le code est structuré pour un **portage natif ultérieur** (Expo/React Native)
  sans réécrire la logique métier.

## 2. Contrainte structurante : l'API Clash Royale

L'API officielle (`developer.clashroyale.com`) impose :

1. une **clé secrète** — impossible à embarquer dans un client distribué ;
2. cette clé est **verrouillée sur des IP fixes** — incompatible avec des
   clients mobiles dont l'IP change constamment.

**Conséquence** : même une app « 100 % locale » a besoin d'**un point cloud
minimal** pour détenir la clé et faire l'appel. Ce point est une **fonction
serverless** (déployée une fois, gratuite, sans serveur à maintenir), pas un
serveur applicatif.

Pour l'IP fixe : passage par le **proxy communautaire `proxy.royaleapi.com`**,
dont l'IP est whitelistée une seule fois dans la clé Supercell. Détails à
revérifier au moment de l'implémentation.

Chaîne : `PWA → Cloudflare Pages Function (détient la clé) → proxy.royaleapi.com → API Supercell`

## 3. Stack

| Élément | Choix | Raison |
|---|---|---|
| App | PWA — **React + Vite + TypeScript**, `vite-plugin-pwa` | Léger, orienté front pur, transfert direct des compétences web |
| Logique métier | Modules **TS purs** (`core/`), zéro dépendance React ni navigateur | Testable isolément ; port natif futur sans réécriture |
| Stockage local | **IndexedDB via Dexie**, derrière une interface `Repository` | Requêtes + relations légères ; l'implémentation est remplaçable (SQLite au portage natif) |
| Moteur de reco | Module TS on-device | Aucune donnée sensible, calcul léger, marche hors ligne, coût nul |
| Relais API CR | **Cloudflare Pages Function** + secret `CLASH_API_TOKEN` | Déployé une fois, gratuit jusqu'à ~100k req/j, rien à maintenir |
| Decks méta | Fichier YAML curé dans le repo → build CI → `meta-decks.json` statique | Pas de back-office, pas de serveur, curation = éditer un fichier |
| Hébergement | **Cloudflare Pages** (app + function au même endroit) | Gratuit, un seul déploiement |
| Auth | **aucune** | Tout est local, l'identité = le tag CR. Supprime un sous-système entier |
| Coût récurrent | **0 €** | |

## 4. Architecture et découpage du code

Monorepo léger :

```
app/                    → PWA React (rendu uniquement)
  screens/              → Profil, Decks, Suggestion, Réglages
  components/
core/                   → LOGIQUE MÉTIER, zéro React, testable seule
  domain/               → types : Card, Deck, PlayerProfile, Goal, Recommendation…
  recommendation/       → moteur de suggestion de deck
  meta/                 → chargement + cache des decks méta
  clash-api/            → client typé de NOTRE relais (jamais l'API Supercell directe)
  sync/                 → orchestrateur de synchronisation
storage/                → couche persistance locale (Dexie) derrière l'interface Repository
functions/              → Cloudflare Pages Function : le relais API CR
scripts/
  build-meta.ts         → validation + build du JSON méta (CI)
  meta-scraper/         → (v2) GitHub Action de scraping → candidats à revoir à la main
data/
  meta-decks.yaml       → base de connaissance des decks méta (curée)
  tier-levels.yaml      → niveau de carte attendu par palier de trophées (curé)
  upgrade-costs.yaml    → coût d'upgrade par niveau/rareté (données statiques du jeu)
docs/
```

### Frontières nettes

1. `app/` ↔ `core/` : l'UI appelle des fonctions pures / services, ne calcule rien.
2. `core/clash-api/` ↔ `functions/` : seul point qui parle au monde extérieur pour
   les données joueur. Contrat HTTP simple.
3. `core/meta/` ↔ `meta-decks.json` : chargé au démarrage, mis en cache local.
4. `core/` ↔ `storage/` : via l'interface `Repository` uniquement. Aucune
   référence à Dexie/IndexedDB dans `core/`.

### Flux de données global

```
iPhone (PWA)
  │  saisie du tag
  ├──> core/clash-api ──> Cloudflare Function ──> proxy.royaleapi.com ──> API Supercell
  │  <────────────── profil + battlelog JSON ──────────────────────────────┘
  ├──> storage (IndexedDB) : snapshot profil, events de niveau de carte, battles
  ├──> core/meta : decks méta (JSON en cache)
  └──> core/recommendation : (cartes + palier + objectif + decks méta) → suggestion
              └──> affichage + persistance dans recommendations
```

## 5. Modèle de données local

Principe : **persister ce qui a une valeur historique ou ce que l'API ne
redonne pas ; recalculer le reste à la volée.**

### Stores persistés

| Store | Contenu | Cadence | Raison |
|---|---|---|---|
| `settings` | tag joueur, id objectif actif, prefs UI | à chaque changement | l'API ne stocke rien pour nous |
| `syncs` | `{at, trophies, kingLevel, arena}` | 1 par sync | courbe de progression, léger |
| `cardState` | état **actuel** de chaque carte : `{cardId, name, level, maxLevel, count, rarity, elixir, evoLevel}` | upsert à chaque sync | nourrit le moteur de reco, base de diff |
| `cardLevelEvents` | append-only : `{cardId, at, fromLevel→toLevel, fromCount→toCount}` — écrit **uniquement si changement** | à chaque sync si diff | historique léger, courbes faciles, pas de snapshot lourd |
| `battles` | 25 derniers combats, dédup `(battleTime + tag adverse)` : `{at, mode, result, crownsFor/Against, trophyChange, myDeck[8], oppDeck[8]}` | à chaque sync | l'API ne garde que 25 combats ; analyse = v2 mais on capte la donnée dès maintenant |
| `goals` | `{id, targetTrophies, createdAt, achievedAt, active}` — un seul actif | création / MAJ | purement local |
| `recommendations` | append-only : `{id, at, context:{trophies,kingLevel,targetTrophies,metaVersion}, output:{transitionDeck[8], finalDeck[8], upgradePriority[], summary}, userAction: null\|'suivie'\|'écartée'}` | à chaque génération | progression vers la cible, historique des conseils, filtrage des decks écartés |
| `metaCache` | JSON des decks méta + `fetchedAt` | rafraîchi si > 24 h | cache, hors ligne |
| `cardsCatalog` | référentiel de toutes les cartes (depuis `/cards`) | rafraîchi si > 7 j | noms, raretés, coût élixir, max level |

### Non persisté (recalculé à la demande)

- Suggestions de deck : recalculées depuis `cardState` + `metaCache` + `goals`.
  (Le *résultat* d'une génération est archivé dans `recommendations` ; le calcul lui-même ne l'est pas.)
- Stats de combat (winrate, cartes qui font perdre) : dérivées de `battles` à l'affichage.
- Écart au deck cible : dérivé.

### v2

- `resourceDeclarations` : `{at, gold, gems, wildcards:{common,rare,epic,legendary,champion}}` — saisie ponctuelle.

## 6. Moteur de suggestion de deck

Entrées : cartes possédées + niveaux, trophées actuels, objectif ; base de decks
méta ; tables de référence curées (niveau attendu par palier, coût d'upgrade par
niveau/rareté).

Sorties : **deck de transition** (jouable maintenant), **deck final** (cible),
**ordre de priorité d'upgrade**.

### Algorithme (déterministe, explicable)

**Étape 1 — deck final.** Parmi les decks méta dont la plage de trophées couvre
l'objectif :

```
score = force_méta(winRate × usage)
      − coût_total_upgrade × w_cost
      − (8 − cartes_possédées) × w_missing
```

**Étape 2 — deck de transition.** *Sélection séquentielle* : une fois le deck
final fixé, parmi les decks que le joueur **possède en entier** :

```
score = force_méta
      + proximité_avec_le_deck_final(cartes & archétype partagés) × w_prox
      − écart_de_niveau_actuel × w_level
```

→ le deck jouable tout de suite qui ressemble le plus au deck final (upgrades et
réflexes de jeu servent aux deux).

**Cas « aucun deck méta complet possédé »** (reprise après longue pause) :
**match partiel**. On propose le deck méta le plus proche possédé à ≥ 6/8, en
affichant clairement les cartes manquantes et comment les débloquer. Pas de
moteur de substitution par rôle au MVP.

**Étape 3 — ordre de priorité d'upgrade.** Pour les 8 cartes du deck final avec
leur niveau cible :

1. d'abord les cartes présentes **à la fois** dans le deck de transition ET le
   deck final (bénéfice immédiat) ;
2. ensuite par meilleur rapport **impact / coût** (win conditions et cartes clés
   pondérées plus haut).

Sortie : liste ordonnée `carte : niv X → niv Y, ~N copies + or`.

**Étape 4 — explication.** Chaque suggestion est livrée avec un « pourquoi »
court et lisible (critère de design : l'opacité était le reproche fait à la
première tentative).

### Notes de calibrage (à affiner en implémentation)

- Poids `w_*` : valeurs de départ à ajuster sur des cas réels.
- « Niveau attendu par palier » : table curée dans `data/tier-levels.yaml`,
  valeurs indicatives à valider par l'auteur (qui connaît la méta).
- Le calcul porte sur ~30-40 decks méta max → coût négligeable même en
  évaluant toutes les combinaisons.

## 7. Synchronisation avec l'API Clash Royale

### Relais (Cloudflare Pages Function)

Trois routes, **pass-through pur** (aucune logique métier) :

| Route (app) | Cible |
|---|---|
| `GET /api/player/:tag` | `proxy.royaleapi.com/v1/players/%23{tag}` |
| `GET /api/player/:tag/battles` | `…/v1/players/%23{tag}/battlelog` |
| `GET /api/cards` | `…/v1/cards` |

- Clé Supercell en **secret Cloudflare** (`CLASH_API_TOKEN`), jamais dans le bundle.
- Ajout `Authorization: Bearer …` + passage par `proxy.royaleapi.com`.
- **Cache Cloudflare 60 s** par tag.
- CORS limité à l'origine de l'app.
- Mapping d'erreurs → messages clairs : `404` tag introuvable · `429` trop de
  requêtes · `503` API en maintenance (fréquent pendant les MAJ du jeu).
- Le tri/nettoyage des champs se fait sur le téléphone (`core/clash-api`).

### Flux de sync (`core/sync`)

```
syncPlayer(tag) :
  1. GET /api/player/:tag         → profil (trophées, kingLevel, arène, cartes[])
  2. GET /api/player/:tag/battles → 25 derniers combats
  3. si cardsCatalog > 7 j       → GET /api/cards
  4. transaction locale :
     a. lire cardState précédent
     b. diff → cardLevelEvent pour chaque niveau/nombre de copies changé
     c. upsert cardState
     d. append cardLevelEvents
     e. insert ligne syncs
     f. upsert battles (dédup)
  5. retour : {nouveaux events, Δ trophées, nouveaux combats}
```

### Déclenchement

- À l'ouverture si dernière sync > 30 min.
- Bouton « rafraîchir » manuel, cooldown 60 s.
- Pas de sync en arrière-plan (PWA).

### Cas particuliers

- **Premier lancement** : saisie tag → validation format (`#` + 8-9 caractères) →
  sync. La sync initiale crée le `cardState` de référence **sans events**.
- **Hors ligne** : lectures OK depuis IndexedDB ; sync échoue proprement
  (« hors ligne — données du {date} »).
- **Decks méta** : à l'ouverture, si `metaCache` > 24 h et en ligne → re-fetch.

## 8. Pipeline des decks méta

### Sources et curation

- **MVP** : curation **manuelle** dans `data/meta-decks.yaml` (l'auteur connaît
  la méta ; le scraping automatisé de RoyaleAPI est déconseillé par eux).
- **v2** : GitHub Action hebdo → `meta-decks.candidates.yaml`, **revu et mergé à
  la main**, jamais publié automatiquement.

### Format

```yaml
version: 2026-09-03
tiers:
  - range: [5000, 6500]
    decks:
      - id: hog-2.6
        name: "Hog Cycle 2.6"
        archetype: cycle
        cards: [hog-rider, musketeer, ice-spirit, skeletons, cannon, fireball, the-log, ice-golem]
        evolutions: [ice-spirit]
        winRate: 0.56
        usage: 0.08
        avgElixir: 2.6
        note: "Exigeant, récompense la discipline de cycle"
```

Les `id` de cartes sont des slugs normalisés, générés depuis `/api/cards`
(mapping nom ↔ slug validé automatiquement au build).

### Build (`scripts/build-meta.ts`, en CI)

1. lit `meta-decks.yaml` + `tier-levels.yaml` + `upgrade-costs.yaml` ;
2. **valide** : chaque slug existe dans le catalogue, 8 cartes/deck, plages
   cohérentes, `winRate ∈ [0,1]` ;
3. émet `public/meta-decks.json` (compact), servi statiquement ;
4. une copie est **bundlée dans l'app au build** (premier lancement + hors ligne).

### Livraison

- L'app fetch `/meta-decks.json` à l'ouverture si `metaCache` > 24 h.
- `version` stocké dans chaque reco (`context.metaVersion`).

### Boucle de curation

Éditer le YAML → commit → CI valide et publie → l'app récupère sous 24 h.

## 9. Écrans (MVP)

| Écran | Contenu |
|---|---|
| **Réglages / onboarding** | Saisie et validation du tag · définition de l'objectif de trophées |
| **Profil** | Trophées (actuels / record), king level, arène · courbe de trophées (`syncs`) · collection de cartes avec niveaux · bouton rafraîchir |
| **Suggestion** | Deck de transition · deck final · ordre de priorité d'upgrade · « pourquoi » · widget « progression vers la cible : N/8 cartes au niveau requis » · bouton générer une nouvelle suggestion |
| **Historique** | Liste des suggestions passées avec leur contexte (méta, objectif) · marquer suivie / écartée · battlelog des 25 derniers combats (affichage brut, analyse = v2) |

## 10. Tests

- `core/recommendation` : cas de référence (joueur complet, joueur en reprise,
  objectif hors de portée, égalité de scores) → sorties déterministes attendues.
- `core/sync` : diff `cardState` → `cardLevelEvents` (pas d'event si rien ne
  change ; event si niveau ↑ ; event si copies ↑ ; premier lancement = 0 event).
- `core/clash-api` : mapping des réponses proxy → types du domaine ; mapping des
  erreurs HTTP.
- `scripts/build-meta` : rejet d'un deck à 7 cartes, d'un slug inconnu, d'un
  `winRate` hors bornes.
- `functions/` : pass-through, injection du header, CORS, mapping d'erreurs
  (avec un faux upstream).

## 11. Décisions ouvertes / à trancher en implémentation

- Couche SQL locale : Dexie (IndexedDB) au MVP ; évaluer wa-sqlite/OPFS si le
  besoin de vraies requêtes SQL se confirme.
- Valeurs exactes des poids du moteur de reco.
- Bibliothèque UI / design system de la PWA.
- Hébergement du `meta-decks.json` : avec l'app sur Cloudflare Pages (défaut) ou
  séparé (R2 / GitHub Pages).

## 12. Hors périmètre (explicite)

- Aucune analyse « frame par frame » des replays (l'API ne le permet pas).
- Aucune donnée or/gemmes/jokers automatique (l'API ne les expose pas) — saisie
  ponctuelle en v2.
- Pas de backend applicatif, pas de base de données serveur, pas de comptes au MVP.
