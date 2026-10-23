# CLAUDE.md

Instructions pour travailler sur ce projet.

## Orientation

MyCR (coach Clash Royale) est une **PWA local-first**. Il n'y a pas de backend
applicatif : la logique tourne sur le téléphone, les données sont dans
IndexedDB. La seule brique serveur est une fonction serverless (`functions/`)
qui relaie les appels à l'API Clash Royale parce que sa clé est secrète et liée
à une IP fixe.

Le découpage impose une règle : **`core/` ne connaît ni React ni le
navigateur.** Toute la logique métier (moteur de reco, sync, chargement méta)
vit dans `core/` en TypeScript pur et se teste isolément. `app/` ne fait que du
rendu. `storage/` est derrière l'interface `Repository` — `core/` n'importe
jamais Dexie directement. Cette discipline sert le portage natif (Expo) prévu
plus tard.

Conception complète et raisonnement des choix :
`docs/superpowers/specs/2026-09-03-clash-royale-coach-design.md`.

## Conventions

*À compléter au fur et à mesure (style de code, lint, nommage).*

## Commandes

*À compléter une fois l'outillage en place (dev, build, test, déploiement).*

## Pièges connus

- **Ne jamais** committer la clé de l'API Clash Royale — c'est un secret
  Cloudflare (`CLASH_API_TOKEN`), pas une variable du repo.
- Le repo est **public** : aucun tag joueur réel, aucune donnée perso dans le
  code, les commits ou les fichiers de suivi.
- L'API Clash Royale renvoie `503` pendant les mises à jour du jeu — prévoir le
  cas partout où on l'appelle.
- L'API ne garde que les **derniers combats** (25 d'après la doc, 30 observés
  le 2026-10-23) : si on veut de l'historique, il faut les persister à chaque
  sync.
- Les niveaux de cartes de l'API sont **relatifs à la rareté** ; le jeu les
  affiche sur 1..16 (`GAME_MAX`). Si Supercell ajoute un niveau, revoir
  `core/clash-api/normalize.ts` et `rarityFromMaxLevel`.
- Scraping de RoyaleAPI déconseillé par eux — la curation méta reste manuelle,
  le scraper (v2) ne fait que proposer des candidats à revoir à la main.

## Git / GitHub

- Repo : https://github.com/doui445/MyClashRoyale (**public**)
- Branche par défaut : `main`
- Compte : `doui445`
- Les fichiers de `docs/brace/` sont versionnés comme le reste.
