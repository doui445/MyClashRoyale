---
project: MyClashRoyale
status: active
uses_git: true
repo: https://github.com/doui445/MyClashRoyale
stack: [TypeScript, React, Vite, PWA, Dexie, Cloudflare Pages Functions]
last_updated: 2026-10-23
next_milestone: "Serveur du relais créé, app en ligne sur l'iPhone"
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
53 tests.

**Déploiement : côté code, tout est prêt.** Icône couronne, config Pages
branchée sur GitHub, et désormais un **relais maison à IP fixe** (`relay/`,
Caddy) qui remplace le proxy RoyaleAPI disparu. Testé en local de bout en bout
(fonction → relais → Supercell). Reste la partie manuelle : compte Oracle
Cloud, VM, installation, secrets Cloudflare (`relay/README.md`).

**En local, ça marche avec de vraies données** : le relais appelle
`api.clashroyale.com` directement (`CLASH_API_BASE`, seconde clé liée à l'IP
de la box). Premier test de bout en bout réussi le 2026-10-23 (profil, 123
cartes, combats). Il a révélé que le jeu va jusqu'au niveau 16 et non 14 :
corrigé, les niveaux affichés sont désormais justes.

## Ce qui marche

- Build, typecheck et 53 tests verts.
- Test de bout en bout réel en local (`npm run pages:dev`, port 8788).
- Niveaux de cartes vérifiés sur les 123 cartes d'un vrai compte.
- Fonction Cloudflare : 3 routes, secret côté serveur, tag validé, cache
  60 s, erreurs gérées, adresse amont réglable, clé de relais envoyée.
- Relais Caddy : seul `GET /v1/*` avec la bonne clé passe (vérifié en local).
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
- Relais pas encore testé sur Oracle même (pare-feu de l'image, certificat
  sslip.io) : seule la config Caddy a été validée, sur le Mac.

## 3 prochaines actions

1. Créer le compte Oracle Cloud et la VM, puis installer le relais
   (`relay/README.md`) ; créer le projet Pages et ses secrets.
2. Effacer les données du site dans le navigateur, se reconnecter, cliquer
   Rafraîchir et vérifier l'absence de doublons.
3. Persister le profil joueur (mode hors ligne), puis écrire le plan 2
   (pipeline decks méta).
