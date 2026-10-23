---
project: MyClashRoyale
status: active
uses_git: true
repo: https://github.com/doui445/MyClashRoyale
stack: [TypeScript, React, Vite, PWA, Dexie, Cloudflare Pages Functions]
last_updated: 2026-10-23
next_milestone: "Validation locale avec une vraie clé, puis relais à IP fixe pour la mise en ligne"
reminders_list: "non"
category: "Code"
backlog_model: "adopté"
language: fr
nested_model: "non"
---

# STATUS — MyClashRoyale

Instantané de l'état courant. Entièrement réécrit chaque session.

## État actuel

L'app s'appelle désormais **MyCR** (nom affiché, manifeste, adresse prévue
`mycr.pages.dev`, base locale) ; « CR Coach » n'était qu'un nom de travail.

**Phase 1 (Fondations) terminée** : PWA (Vite + React + TS), persistance
locale (Dexie derrière `Repository`), relais Cloudflare vers l'API Clash
Royale, `core/clash-api`, `core/sync`, UI minimale (tag → profil/battlelog).
46 tests.

**Déploiement avancé, mais bloqué.** Côté code tout est prêt (icône couronne,
config Pages branchée sur GitHub, procédure dans le README). Mais
`proxy.royaleapi.com`, qui fournissait l'IP fixe exigée par Supercell, ne
résout plus (2026-10-23). Sans relais à IP fixe, l'app en ligne ne peut pas
appeler l'API.

**En local, débloqué** : le relais accepte `CLASH_API_BASE` pour appeler
`api.clashroyale.com` directement, avec une seconde clé liée à l'IP de la
box. `npm run pages:dev` (corrigé, il plantait) sert l'app sur
http://localhost:8788.

## Ce qui marche

- Build, typecheck et 46 tests verts.
- `npm run pages:dev` démarre : page, manifeste et clé chargée vérifiés.
- Relais : 3 routes, secret côté serveur, tag validé, cache 60 s, erreurs
  gérées, adresse amont réglable.
- `core/clash-api`, `core/sync`, UI minimale.
- Manifeste PWA complet avec icônes.

## Angles morts connus

- **Aucun appel réussi à la vraie API pour l'instant** : en attente de la
  seconde clé (IP de la box) côté auteur.
- Fixtures `core/clash-api/__fixtures__/` et `normalizeCardLevel` /
  `rarityFromMaxLevel` synthétiques, à valider contre une vraie réponse.
- IP de la box possiblement dynamique : si elle change, la clé locale cesse
  de marcher (403) et doit être recréée.
- Hors ligne : le profil n'est pas persisté (BACKLOG priorité haute).
- L'adresse `mycr.pages.dev` suppose que le nom est libre chez Cloudflare.
- Wrangler 3 signalé obsolète (v4 disponible), non mis à jour.

## 3 prochaines actions

1. Créer la seconde clé (IP de la box), remplir `.dev.vars` avec
   `CLASH_API_BASE`, puis valider fixtures + test de bout en bout en local.
2. Décider du relais de production : vérifier l'état du proxy RoyaleAPI
   (Discord), sinon relais maison sur un serveur à IP fixe.
3. Persister le profil joueur (mode hors ligne), puis écrire le plan 2
   (pipeline decks méta).
