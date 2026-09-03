# JOURNAL — MyClashRoyale

Journal chronologique daté. Ajout uniquement.

## 2026-09-03 — Amorçage : besoins, stack, conception

Point de départ : une première conversation (celle du frère de l'auteur,
non-développeur) avait laissé Claude décider seul d'une stack backend
FastAPI + PostgreSQL + hébergement à IP fixe, sans pilotage des besoins. Résumé
conservé dans `docs/context-conversation-frere.md`.

Session pilotée cette fois par l'auteur (développeur). Décisions :

- **On repart de zéro**, besoins et technique.
- Cible : **app publique** à terme, mais pour l'instant **install privée sur
  2 iPhones** (auteur + frère) via **PWA** (pas de store, pas de compte Apple,
  0 €). Code structuré pour un portage natif Expo ultérieur.
- Contrainte identifiée : la clé de l'API Clash Royale est secrète **et** liée à
  une IP fixe → une **fonction serverless** minimale est incompressible pour
  détenir la clé et relayer, via `proxy.royaleapi.com`.
- Stack : PWA React + Vite + TS, logique métier en TS pur (`core/`), IndexedDB
  via Dexie, relais Cloudflare Pages Function, decks méta en YAML curé → JSON
  statique via CI. **Pas d'auth** (tout est local, identité = tag CR).
- Moteur de reco : sélection **séquentielle** (deck final puis deck de transition
  le plus proche possédé). Si aucun deck méta complet possédé → **match partiel
  ≥ 6/8 + affichage des cartes manquantes** (pas de moteur de substitution).
- Modèle de données : ajout d'un store `recommendations` (historique des
  suggestions) sur proposition de l'auteur.

Conception écrite et validée section par section :
`docs/superpowers/specs/2026-09-03-clash-royale-coach-design.md`.

Mise en place : repo GitHub **public** `doui445/MyClashRoyale`, fichiers de
suivi (langue française en override pour ce projet), catégorie « Code », pas de
synchro Rappels.

Spec relu et validé par l'auteur. Repo poussé sur GitHub.

**Plan d'implémentation phase 1 (Fondations)** écrit :
`docs/superpowers/plans/2026-09-03-fondations.md`. Découpage du MVP en 3 plans
(Fondations · Pipeline méta · Reco + écrans + déploiement). La phase 1 = 9 tâches
TDD produisant une PWA qui synchronise un tag joueur et affiche profil +
battlelog persistés.

Doc à jour consultée via Context7 pour `vite-plugin-pwa` (registerType
autoUpdate, `virtual:pwa-register/react`) et Cloudflare Pages Functions (routing
`functions/`, `context.params`, `context.env`, `wrangler pages dev`).

Prochaine étape : exécuter le plan 1.
