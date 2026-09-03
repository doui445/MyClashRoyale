---
project: MyClashRoyale
status: active
uses_git: true
repo: https://github.com/doui445/MyClashRoyale
stack: [TypeScript, React, Vite, PWA, Dexie, Cloudflare Pages Functions]
last_updated: 2026-09-03
next_milestone: "MVP phase 1 — Fondations (scaffold + synchro API)"
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

Le MVP est découpé en **3 plans**. Le **plan 1 (Fondations)** est écrit :
`docs/superpowers/plans/2026-09-03-fondations.md` — 9 tâches TDD (scaffold PWA,
types domaine, interface `Repository` + impl mémoire + impl Dexie, relais
Cloudflare 3 routes, client `core/clash-api`, orchestrateur `core/sync`, UI
minimale). Livrable : saisir un tag → synchro → profil/battlelog persistés et
affichés.

Plans 2 (pipeline méta) et 3 (moteur de reco + écrans + déploiement) restent à
écrire.

Aucune ligne de code applicatif écrite. Repo GitHub public créé.

Prochaine étape : exécuter le plan 1 (subagent-driven ou inline).

## Ce qui marche

- Dépôt initialisé (`git`, branche `main`, remote GitHub public).
- Fichiers de suivi en place.
- Conception documentée et validée point par point.
- Plan d'implémentation de la phase 1 écrit (9 tâches TDD).

## Angles morts connus

- Détails de l'intégration `proxy.royaleapi.com` (IP à whitelister, limites de
  débit) à revérifier au moment de coder.
- Poids du moteur de reco : valeurs à calibrer sur des cas réels.
- Table « niveau de carte attendu par palier de trophées » à remplir (curation).
- Bibliothèque UI / design system de la PWA non choisie.

## 3 prochaines actions

1. Exécuter le plan 1 (Fondations) tâche par tâche.
2. Écrire le plan 2 (pipeline decks méta).
3. Récupérer une clé de dev de l'API Clash Royale + whitelister l'IP du proxy
   RoyaleAPI (nécessaire pour les fixtures et le test manuel de la Task 7/9).
