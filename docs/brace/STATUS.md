---
project: MyClashRoyale
status: active
uses_git: true
repo: https://github.com/doui445/MyClashRoyale
stack: [TypeScript, React, Vite, PWA, Dexie, Cloudflare Pages Functions]
last_updated: 2026-10-23
next_milestone: "Relais à IP fixe pour la mise en ligne"
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
47 tests.

**Déploiement avancé, mais bloqué.** Côté code tout est prêt (icône couronne,
config Pages branchée sur GitHub, procédure dans le README). Mais
`proxy.royaleapi.com`, qui fournissait l'IP fixe exigée par Supercell, ne
résout plus (2026-10-23). Sans relais à IP fixe, l'app en ligne ne peut pas
appeler l'API.

**En local, ça marche avec de vraies données** : le relais appelle
`api.clashroyale.com` directement (`CLASH_API_BASE`, seconde clé liée à l'IP
de la box). Premier test de bout en bout réussi le 2026-10-23 (profil, 123
cartes, combats). Il a révélé que le jeu va jusqu'au niveau 16 et non 14 :
corrigé, les niveaux affichés sont désormais justes.

## Ce qui marche

- Build, typecheck et 47 tests verts.
- Test de bout en bout réel en local (`npm run pages:dev`, port 8788).
- Niveaux de cartes vérifiés sur les 123 cartes d'un vrai compte.
- Relais : 3 routes, secret côté serveur, tag validé, cache 60 s, erreurs
  gérées, adresse amont réglable.
- `core/clash-api`, `core/sync`, UI minimale.
- Manifeste PWA complet avec icônes.

## Angles morts connus

- Absence de doublons après un rafraîchissement : pas encore vérifiée.
- Données synchronisées avant le correctif des niveaux : à effacer dans le
  navigateur, sinon fausses montées de niveau au prochain rafraîchissement.
- IP de la box possiblement dynamique : si elle change, la clé locale cesse
  de marcher (403) et doit être recréée.
- Hors ligne : le profil n'est pas persisté (BACKLOG priorité haute).
- L'adresse `mycr.pages.dev` suppose que le nom est libre chez Cloudflare.
- Wrangler 3 signalé obsolète (v4 disponible), non mis à jour.

## 3 prochaines actions

1. Effacer les données du site dans le navigateur, se reconnecter, cliquer
   Rafraîchir et vérifier l'absence de doublons.
2. Décider du relais de production : vérifier l'état du proxy RoyaleAPI
   (Discord), sinon relais maison sur un serveur à IP fixe.
3. Persister le profil joueur (mode hors ligne), puis écrire le plan 2
   (pipeline decks méta).
