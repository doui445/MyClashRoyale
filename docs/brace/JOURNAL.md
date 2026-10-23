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

## 2026-09-04 — Phase 1 (Fondations) implémentée et revue

Exécution du plan 1 en mode subagent-driven, dans un worktree isolé
(`worktree-fondations`) : un sous-agent par tâche, revue systématique après
chaque tâche (conformité au spec + qualité), tours de correction quand
nécessaire, revue finale de toute la branche à la fin.

Les 9 tâches sont passées : scaffold PWA, types du domaine, interface
`Repository` (+ impl mémoire et Dexie), relais Cloudflare (3 routes), client
`core/clash-api`, orchestrateur `core/sync`, UI minimale. Deux tâches (7 et 9)
avaient une dépendance bloquante — aucune clé d'API Clash Royale disponible
dans cet environnement — traitée en construisant des fixtures synthétiques
documentées comme telles plutôt qu'en bloquant, avec suivi en BACKLOG.

Deux tours de correction en cours de route : Task 1 (config `tsconfig`
composite/references mal posée dans le plan lui-même, artefacts compilés
committés par erreur) et Task 5 (pas de gestion d'erreur réseau dans le
relais, même origine — un trou du plan, pas de l'implémentation).

**Revue finale de toute la branche** (modèle le plus capable) : a trouvé une
**faille de sécurité** (le relais Cloudflare acceptait le tag joueur sans le
valider — une valeur contenant des `../` pouvait détourner l'appel vers une
route arbitraire de l'API Clash Royale en portant notre clé secrète ; dépôt
public) et plusieurs bugs importants (niveau/niveau-max de carte sur deux
échelles différentes → affichage du type « niv. 9/6 » ; ordre d'écriture de
la synchro pouvant perdre l'historique en cas d'échec partiel ; double
synchro en développement à cause de React StrictMode ; README resté à l'état
d'avant-implémentation). Un lot de correctifs a été décidé et appliqué (voir
DECISIONS.md pour le détail et ce qui a été volontairement repoussé en
BACKLOG plutôt que traité en douce), revérifié par une relecture ciblée :
tout est passé, 45/45 tests, aucune régression.

Fichiers de suivi mis à jour en conséquence (STATUS, BACKLOG, DECISIONS,
CHANGELOG).

Branche `worktree-fondations` fusionnée dans `main` (fast-forward), tests
revalidés sur le résultat (45/45), poussée sur GitHub. Worktree et branche
nettoyés.
