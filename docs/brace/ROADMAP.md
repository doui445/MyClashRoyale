# ROADMAP — MyClashRoyale

Synthèse priorisée. Le détail brut est dans BACKLOG.md.

## Fait

- Conception validée (architecture, modèle de données, moteur de reco, synchro
  API, pipeline méta) — voir `docs/superpowers/specs/2026-09-03-clash-royale-coach-design.md`.
- Repo GitHub public + fichiers de suivi.
- **Phase 1 — Fondations** : scaffold PWA, relais API Clash Royale (Cloudflare
  Pages Function) + client `core/clash-api`, persistance locale (Dexie
  derrière l'interface `Repository`), flux de synchro (`core/sync`), UI
  minimale (onboarding + profil/battlelog). Revue finale passée (1 faille
  sécurité + plusieurs bugs corrigés avant merge, voir DECISIONS.md).

## Focus actuel

**MVP — suggestion de deck.**

1. ~~Plan d'implémentation phase 1 (`superpowers:writing-plans`).~~ ✅
2. ~~Scaffold : Vite + React + TS + `vite-plugin-pwa`, structure `core/`
   `storage/` `functions/`.~~ ✅
3. ~~Relais API Clash Royale (Cloudflare Pages Function) + client
   `core/clash-api`.~~ ✅
4. ~~Persistance locale (Dexie) derrière l'interface `Repository`.~~ ✅
5. ~~Flux de synchro (`core/sync`) : profil, battlelog, diff des niveaux de
   cartes.~~ ✅
6. Pipeline méta : `data/meta-decks.yaml` + `scripts/build-meta.ts` + CI.
7. Moteur de suggestion de deck (`core/recommendation`).
8. Écrans : réglages, suggestion, historique (onboarding + profil faits en
   phase 1).
9. Déploiement Cloudflare Pages + installation PWA sur les 2 iPhones —
   **avancé avant l'étape 6** (2026-10-23) : icône et config prêtes, reste la
   création du projet Pages côté Cloudflare. Le proxy RoyaleAPI ayant
   disparu, relais maison construit (`relay/`) : reste à créer le serveur
   Oracle Cloud et à l'installer.

## Après le MVP

- Reco d'upgrade budgétée (saisie ponctuelle or/gemmes/jokers).
- Analyse du battlelog : points faibles, matchups difficiles.
- Scraper méta automatisé (GitHub Action → candidats revus à la main).

## Idées non priorisées

- Distribution publique (App Store via portage Expo).
- Comptes + sync multi-appareils via BaaS managé.
- Partage de decks / fonctions sociales entre amis.
