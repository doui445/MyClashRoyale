---
project: MyClashRoyale
status: active
uses_git: true
repo: https://github.com/doui445/MyClashRoyale
stack: [TypeScript, React, Vite, PWA, Dexie, Cloudflare Pages Functions]
last_updated: 2026-09-03
next_milestone: "MVP — suggestion de deck"
reminders_list: "non"
category: "Code"
backlog_model: "adopté"
language: fr
---

# STATUS — MyClashRoyale

Instantané de l'état courant. Entièrement réécrit chaque session.

## État actuel

Projet en amorçage. La **conception est terminée et validée** (5 sections :
architecture, modèle de données local, moteur de reco, synchro API, pipeline
méta). Le document de conception est écrit :
`docs/superpowers/specs/2026-09-03-clash-royale-coach-design.md`.

Aucune ligne de code applicatif écrite. Repo GitHub public créé.

Prochaine étape : passer du spec au **plan d'implémentation** (skill
`superpowers:writing-plans`), après relecture du spec par l'auteur.

## Ce qui marche

- Dépôt initialisé (`git`, branche `main`, remote GitHub public).
- Fichiers de suivi en place.
- Conception documentée et validée point par point.

## Angles morts connus

- Détails de l'intégration `proxy.royaleapi.com` (IP à whitelister, limites de
  débit) à revérifier au moment de coder.
- Poids du moteur de reco : valeurs à calibrer sur des cas réels.
- Table « niveau de carte attendu par palier de trophées » à remplir (curation).
- Bibliothèque UI / design system de la PWA non choisie.

## 3 prochaines actions

1. L'auteur relit le document de conception et valide ou demande des ajustements.
2. Générer le plan d'implémentation via `superpowers:writing-plans`.
3. Scaffolder le projet (Vite + TS + PWA, structure `core/` `app/` `storage/`
   `functions/`).
