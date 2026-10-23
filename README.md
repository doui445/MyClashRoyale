# MyCR

Application qui conseille un joueur de Clash Royale sur **quel deck jouer** et
**quelles cartes améliorer en priorité**, selon ses cartes possédées, son palier
de trophées et un objectif fixé.

Pensée pour un joueur qui reprend après une longue pause : elle propose un deck
jouable tout de suite, un deck à viser, et l'ordre dans lequel monter les cartes
pour passer de l'un à l'autre.

Application de fan **non officielle**, non affiliée à Supercell ni approuvée
par Supercell (voir la [charte des contenus de fans](https://supercell.com/en/fan-content-policy/)).

## Statut

Phase 1 (Fondations) implémentée : l'app synchronise un tag joueur Clash Royale
via le relais Cloudflare et affiche le profil et le battlelog, persistés en
local (Dexie). Validée de bout en bout en local avec de vraies données. Voir
[`docs/superpowers/specs/2026-09-03-clash-royale-coach-design.md`](docs/superpowers/specs/2026-09-03-clash-royale-coach-design.md)
pour le document de conception complet, et
[`docs/brace/STATUS.md`](docs/brace/STATUS.md) pour l'état courant détaillé.

## Principe technique

- **PWA** (React + Vite + TypeScript) installée sur le téléphone via Safari.
  Pas de store, pas de compte développeur, coût récurrent 0 €.
- **Tout est local** : les données du joueur vivent dans le navigateur
  (IndexedDB). Pas de comptes, pas de backend applicatif.
- Seule brique cloud : une **fonction serverless** (Cloudflare Pages Function)
  qui détient la clé de l'API Clash Royale et relaie les appels — l'API
  officielle exige une clé secrète liée à une IP fixe, impossible à embarquer
  dans un client mobile.
- Les **decks méta** sont un fichier YAML curé à la main dans le repo, publié en
  JSON statique par la CI.

## Stack

TypeScript · React + Vite · `vite-plugin-pwa` · Dexie (IndexedDB) ·
Cloudflare Pages + Pages Functions · GitHub Actions (build des decks méta)

## Structure

| Dossier | Rôle |
|---|---|
| `src/` | La PWA React — rendu uniquement |
| `core/` | Logique métier pure (TS, sans React) : reco, sync, méta, types |
| `storage/` | Persistance locale (Dexie) derrière une interface `Repository` |
| `functions/` | La fonction Cloudflare qui appelle l'API Clash Royale |
| `relay/` | Le relais à IP fixe (Caddy) qu'elle traverse en production |
| `scripts/` | Build et validation des decks méta |
| `data/` | Bases de connaissance curées (decks méta, niveaux par palier, coûts d'upgrade) |
| `docs/` | Conception, suivi de projet, contexte |

## Développement

```bash
npm install
```

Copier `.dev.vars.example` vers `.dev.vars` et renseigner un vrai
`CLASH_API_TOKEN` (clé obtenue sur https://developer.clashroyale.com). En
local, la fonction appelle l'API directement : la clé doit donc être
whitelistée pour l'IP publique de ta connexion, sans quoi les appels
échouent (`403`).

```bash
npm test          # suite de tests (Vitest)
npm run build     # build de production (tsc -b + vite build)
npm run pages:dev # build puis lancement local avec les Pages Functions (port 8788)
```

## Déploiement (Cloudflare Pages, branché sur GitHub)

Chaque push sur `main` reconstruit et redéploie l'app. Mise en place, une fois :

1. Dashboard Cloudflare → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, choisir ce dépôt.
2. Nom du projet : `mycr` (l'URL devient
   `https://mycr.pages.dev`). Si Cloudflare attribue une autre
   URL, mettre à jour `APP_ORIGIN` dans `wrangler.toml`.
3. Build : preset **None**, commande `npm run build`, dossier `dist`.
4. Monter le **relais à IP fixe** et ajouter les secrets `CLASH_API_TOKEN`,
   `CLASH_API_BASE` et `RELAY_KEY` : procédure complète dans
   [`relay/README.md`](relay/README.md). Puis redéployer.

`wrangler.toml` fait foi pour la config (dont `APP_ORIGIN`) : le dashboard
l'affiche sans permettre de la modifier. Les secrets, eux, ne vont jamais dans
ce fichier.

Les icônes (`public/*.png`) sont générées une fois depuis `public/logo.svg` ;
les régénérer si le logo change.

## Liens

- Dépôt : https://github.com/doui445/MyClashRoyale
- API Clash Royale : https://developer.clashroyale.com
