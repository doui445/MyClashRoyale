# Clash Royale Coach

Application qui conseille un joueur de Clash Royale sur **quel deck jouer** et
**quelles cartes améliorer en priorité**, selon ses cartes possédées, son palier
de trophées et un objectif fixé.

Pensée pour un joueur qui reprend après une longue pause : elle propose un deck
jouable tout de suite, un deck à viser, et l'ordre dans lequel monter les cartes
pour passer de l'un à l'autre.

## Statut

Phase 1 (Fondations) implémentée : l'app synchronise un tag joueur Clash Royale
via le relais Cloudflare et affiche le profil et le battlelog, persistés en
local (Dexie). Validation de bout en bout en attente d'une vraie clé d'API
Clash Royale (voir [`Développement`](#développement) ci-dessous). Voir
[`docs/superpowers/specs/2026-09-03-clash-royale-coach-design.md`](docs/superpowers/specs/2026-09-03-clash-royale-coach-design.md)
pour le document de conception complet, et
[`docs/project-tracker/STATUS.md`](docs/project-tracker/STATUS.md) pour l'état courant détaillé.

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
| `functions/` | Le relais vers l'API Clash Royale |
| `scripts/` | Build et validation des decks méta |
| `data/` | Bases de connaissance curées (decks méta, niveaux par palier, coûts d'upgrade) |
| `docs/` | Conception, suivi de projet, contexte |

## Développement

```bash
npm install
```

Copier `.dev.vars.example` vers `.dev.vars` et renseigner un vrai
`CLASH_API_TOKEN` (clé obtenue sur https://developer.clashroyale.com — l'IP de
sortie de `proxy.royaleapi.com` doit être whitelistée dans cette clé, sans quoi
les appels échouent).

```bash
npm test          # suite de tests (Vitest)
npm run build     # build de production (tsc -b + vite build)
npm run pages:dev # lancement local avec les Pages Functions (proxy Cloudflare)
```

En production (Cloudflare Pages), définir le secret `CLASH_API_TOKEN` :

```bash
npx wrangler pages secret put CLASH_API_TOKEN
```

(ou via le dashboard Cloudflare), ainsi que la variable `APP_ORIGIN` pointant
vers l'URL déployée de l'app.

## Liens

- Dépôt : https://github.com/doui445/MyClashRoyale
- API Clash Royale : https://developer.clashroyale.com
