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

## 2026-10-23 — Passage à BRACE, clé API, icône et préparation du déploiement

Fichiers de suivi déplacés de `docs/project-tracker/` vers `docs/brace/`
(BRACE 1.0), commité et poussé.

Point sur la clé d'API Clash Royale : procédure de création sur
developer.clashroyale.com, IP du proxy RoyaleAPI à autoriser (`45.79.218.79`,
vérifiée dans la doc RoyaleAPI) ajoutée au README. La clé est en cours de
création par l'auteur.

Question « est-ce que ça tourne sur iPhone ? » : oui en tant que PWA, mais il
fallait la mettre en ligne en HTTPS et lui donner une icône. Décidé d'avancer
le déploiement Cloudflare Pages (branché sur GitHub) avant le plan 2, après
vérification que le plan gratuit suffit. Icône couronne dessinée et intégrée ;
config de déploiement préparée. Reste à créer le projet Pages côté Cloudflare
et à y poser le secret `CLASH_API_TOKEN` (voir DECISIONS.md).

## 2026-10-23 (suite) — Premier lancement avec une vraie clé, renommage en MyCR

Premier lancement de `npm run pages:dev` par l'auteur avec sa clé : plantage
immédiat, cause trouvée dans la config wrangler et corrigée (ERRORS.md). En
allant plus loin, découverte que `proxy.royaleapi.com` n'existe plus côté
DNS : toute l'architecture comptait dessus pour l'IP fixe. Déblocage local
via `CLASH_API_BASE` (appel direct avec une seconde clé liée à l'IP de la
box) ; la mise en ligne est suspendue jusqu'à trouver un relais à IP fixe.

Discussion sur le nom : « CR Coach » n'était qu'un nom de travail. Recherche
de concurrents (rien sous « MyCR », « Royale Coach » existe) et de la charte
Supercell (pas de nom de jeu dans un domaine). Renommage complet en **MyCR**
(DECISIONS.md). Reste ouvert : quelle solution de relais pour la production.

## 2026-10-23 (suite 2) — Premier test de bout en bout réussi

Seconde clé (IP de la box) en place : profil, 123 cartes et combats
s'affichent. La vraie réponse API, comparée aux fixtures, a révélé que le jeu
va jusqu'au niveau 16 (et non 14) : bug corrigé (ERRORS.md). Structure des
réponses conforme aux fixtures pour le reste (`battleTime` compact, champs
de carte). Constats mineurs mis en BACKLOG : noms de modes bruts, 30 combats
renvoyés au lieu de 25, cartes non triées. L'auteur a exporté la page en PDF
dans `docs/` : contient son tag et son pseudo, à ne pas committer (dépôt
public).

## 2026-10-23 (suite 3) — Symboles évolution/héros, relais maison

Symboles distincts ✦ évolution / 👑 héros sur le profil, poussés. Le proxy
RoyaleAPI ayant disparu, l'auteur a choisi de construire notre propre relais
plutôt que d'attendre (DECISIONS.md) : Caddy + script d'installation dans
`relay/`, fonction capable d'envoyer `X-Relay-Key`. Testé sur le Mac : règles
d'accès (seul `GET /v1/*` avec la bonne clé passe) et chaîne complète
fonction → relais → Supercell. Reste la partie qui demande l'auteur : compte
Oracle Cloud, création de la VM.
