---
project: MyClashRoyale
status: active
uses_git: true
repo: https://github.com/doui445/MyClashRoyale
stack: [TypeScript, React, Vite, PWA, Dexie, Cloudflare Pages Functions]
last_updated: 2026-09-04
next_milestone: "MVP phase 2 — pipeline decks méta"
reminders_list: "non"
category: "Code"
backlog_model: "adopté"
language: fr
nested_model: "non"
---

# STATUS — MyClashRoyale

Instantané de l'état courant. Entièrement réécrit chaque session.

## État actuel

**Phase 1 (Fondations) implémentée, revue, corrigée.** La PWA scaffoldée
(Vite + React + TS), la persistance locale (Dexie derrière l'interface
`Repository`), le relais Cloudflare vers l'API Clash Royale, le client
`core/clash-api`, l'orchestrateur de synchro `core/sync`, et l'UI minimale
(saisie de tag → profil/battlelog) sont tous en place et testés (45 tests).

Exécutée en mode subagent-driven (9 tâches, chacune avec sa propre revue et,
quand nécessaire, un tour de correction). La **revue finale de toute la
branche** a trouvé et fait corriger avant merge : une **faille de sécurité**
(le relais acceptait un paramètre `tag` non validé, permettant une injection
de segments de chemin vers des routes arbitraires de l'API en portant notre
clé secrète — dépôt public), un bug d'affichage visible (niveau/niveau-max de
carte sur deux échelles différentes), un risque de perte silencieuse
d'historique si une synchro est interrompue, un double-déclenchement de
synchro en dev (React StrictMode), et un README resté à l'état d'avant-
implémentation. Détail complet dans DECISIONS.md.

Travail volontairement laissé de côté (tracké, pas oublié) : deux validations
attendent une vraie clé d'API Clash Royale (fixtures synthétiques du mapping,
test manuel de bout en bout) ; la persistance complète du profil joueur (pour
que le mode hors ligne fonctionne vraiment) et une vraie transaction sur la
synchro sont en BACKLOG priorité haute.

Fusionnée dans `main` et poussée sur GitHub (fast-forward, 45/45 tests
revalidés après fusion). La branche de travail `worktree-fondations` et son
worktree ont été nettoyés.

Plans 2 (pipeline méta) et 3 (moteur de reco + écrans + déploiement Pages)
restent à écrire.

## Ce qui marche

- Dépôt initialisé, GitHub public, fichiers de suivi à jour.
- Conception et plan de la phase 1 documentés et validés.
- Scaffold PWA (Vite/React/TS/Vitest/vite-plugin-pwa), build et typecheck propres.
- Types du domaine, interface `Repository` + implémentations mémoire et Dexie.
- Relais Cloudflare (3 routes, secret côté serveur, tag validé, cache 60 s,
  gestion d'erreurs réseau/HTTP).
- Client `core/clash-api` (mapping, normalisation de niveau, erreurs typées).
- Orchestrateur `core/sync` (diff des niveaux de cartes, dédup des combats,
  ordre d'écriture sûr).
- UI minimale : onboarding avec validation de tag, écran profil/battlelog,
  garde anti-double-synchro, retour à l'onboarding après un échec.
- 45 tests automatisés, `tsc -b` et `npm run build` propres.

## Angles morts connus

- Fixtures `core/clash-api/__fixtures__/` et formule `normalizeCardLevel` /
  repli `rarityFromMaxLevel` sont **synthétiques**, à valider contre une
  vraie réponse API dès qu'une clé de dev existe.
- Test manuel de bout en bout (vrai tag → profil/battlelog → rafraîchir) pas
  encore fait, même raison.
- Hors ligne : le profil (nom, meilleur score) n'est pas encore persisté →
  une ouverture hors connexion affiche une erreur au lieu des données en
  cache (voir BACKLOG priorité haute).
- Poids du moteur de reco (phase 3) : valeurs à calibrer sur des cas réels.
- Table « niveau de carte attendu par palier de trophées » à remplir (curation).
- Bibliothèque UI / design system de la PWA non choisie (phase 3).

## 3 prochaines actions

1. Récupérer une clé de dev de l'API Clash Royale + whitelister l'IP du proxy
   RoyaleAPI — débloque les deux validations en attente.
2. Écrire le plan 2 (pipeline decks méta : `data/meta-decks.yaml`, script de
   build, CI).
3. Persister le profil joueur complet et rendre la synchro transactionnelle
   (BACKLOG priorité haute) avant que le mode hors ligne ne soit sollicité en
   vrai.
