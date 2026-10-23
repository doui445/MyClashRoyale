# BACKLOG — MyClashRoyale

Réservoir brut de toutes les idées. Jamais purgé, seulement archivé.

## Priorité haute

- **Trouver un relais à IP fixe pour la production** : `proxy.royaleapi.com`
  ne résout plus (2026-10-23, voir ERRORS.md). Pistes : vérifier sur le
  Discord RoyaleAPI s'il revient ou a changé d'adresse ; sinon petit relais
  maison sur un serveur à IP fixe (ex. offre gratuite Oracle Cloud), appelé
  par la Function Cloudflare via `CLASH_API_BASE`. Bloque la mise en ligne.
- **Récupérer une clé de dev de l'API Clash Royale** + whitelister l'IP du
  proxy RoyaleAPI. Débloque deux validations en attente depuis la phase
  Fondations : (a) les fixtures synthétiques de `core/clash-api/__fixtures__/`
  et la formule `normalizeCardLevel`/le repli `rarityFromMaxLevel` à valider
  contre une vraie réponse API ; (b) le test manuel de bout en bout (saisir un
  vrai tag, voir profil/cartes/25 combats, rafraîchir, vérifier l'absence de
  doublons) jamais fait faute de clé.
  **Fait le 2026-10-23** : clé obtenue (appel direct, IP de la box), test de
  bout en bout OK, fixtures recalées sur l'échelle réelle (bug GAME_MAX
  trouvé, voir ERRORS.md). Reste à vérifier l'absence de doublons après un
  rafraîchissement.
- **Persister le profil joueur complet** (`name`, `bestTrophies` — absents du
  store `syncs` actuel) et faire renvoyer le profil par `syncPlayer` au lieu
  que `useSync` le re-fetch une deuxième fois. Sans ça, une ouverture hors
  ligne affiche un écran d'erreur alors que cartes/combats/snapshots sont déjà
  en base — ça contredit la promesse « local-first » de l'architecture.
  Repéré à la revue finale de la phase Fondations (2026-09-03).
- **Rendre `core/sync/sync-player.ts` transactionnel** : `putCardState`,
  `appendCardLevelEvents`, `addSync`, `upsertBattles` sont 4 écritures
  indépendantes, pas une transaction. L'ordre a été corrigé (events avant
  cardState, pour qu'un échec ne perde plus l'historique) mais la vraie
  solution est une méthode `Repository.applySync(...)` que `DexieRepository`
  enveloppe dans une transaction Dexie. Repéré à la revue finale (2026-09-03).
- Suggestion de deck (voir ROADMAP) : pipeline méta, moteur de reco, écrans,
  déploiement PWA.
- Table « niveau de carte attendu par palier de trophées » (`data/tier-levels.yaml`)
  à remplir — curation par l'auteur.
- Table des coûts d'upgrade par niveau/rareté (`data/upgrade-costs.yaml`) —
  données statiques du jeu à saisir.
- Premier `data/meta-decks.yaml` : quelques decks par palier pour démarrer.

## Priorité moyenne

- Afficher des noms de modes lisibles dans l'historique : l'API renvoie des
  identifiants bruts (`Chaos_1v1_Draft`, `Event_GlobalLightning_EventDeck`).
  Repéré au premier test réel (2026-10-23).
- L'API renvoie 30 combats (pas 25) : aligner le titre et le `slice(-25)` de
  `src/screens/Profile.tsx` sur ce qui est réellement persisté.
- Trier la liste des cartes du profil (aujourd'hui dans l'ordre de l'API).
- Clarifier `evolutionLevel` : l'app le traite comme « évolution débloquée »
  (✦ si > 0), mais l'API renvoie 1 ou 2 et `maxEvolutionLevel` va jusqu'à 3,
  avec des icônes « hero » dans /cards. Hypothèse non vérifiée : la valeur
  distingue évolution et héros. À confirmer avant que le moteur de reco s'en
  serve (2026-10-23).
- Normaliser `Battle.at` au format ISO-8601 (actuellement le format compact
  de l'API Supercell, ex. `20260901T183045.000Z` — `new Date(...)` dessus
  donne `Invalid Date`). Rien ne casse encore, mais le premier calcul de date
  sur un combat (ex. « combats des 7 derniers jours ») cassera silencieusement.
  Repéré à la revue finale (2026-09-03).
- Implémenter le throttling de synchro du spec §7 (sync à l'ouverture si
  dernière synchro > 30 min ; bouton rafraîchir avec cooldown 60 s) — omis du
  plan de la phase Fondations, l'app synchronise sans condition aujourd'hui.
- Documenter/unifier l'ordre de tri de `Repository.getBattles()` (Dexie trie
  par `at`, `MemoryRepository` non — ça marche seulement parce que l'UI ne
  voit que l'implémentation Dexie).
- Définir `APP_ORIGIN` en production dans `wrangler.toml`/les secrets
  Cloudflare (actuellement non défini → l'en-tête CORS devient la chaîne
  `"undefined"`, sans conséquence tant que l'app est same-origin).
  **Fait le 2026-10-23** (`[vars]` dans `wrangler.toml`).
- Ajouter `onRequestOptions` aux routes `battles`/`cards` du relais (seule la
  route profil l'a aujourd'hui — un futur appelant cross-origin échouerait au
  preflight sur les deux autres).
- Garde contre le changement de tag joueur : `core/sync/sync-player.ts`
  traite un `cardState` vide comme "premier sync" — si un jour l'UI permet de
  changer de compte, ça comparerait les cartes du compte B à celles du compte
  A. Pas atteignable aujourd'hui (aucun flux UI ne permet de changer de tag).
- `Repository.getSyncs()` charge toute la table pour ne lire que la dernière
  ligne (`sync-player.ts` fait `previousSyncs.at(-1)`) — ajouter
  `getLastSync()` à l'interface le jour où ça pèse.
- `DexieRepository.upsertBattles` sur-compte les "nouveaux" combats si le
  même id apparaît deux fois DANS un seul tableau d'entrée (peu probable —
  un fetch de battlelog ne devrait pas contenir de doublons).
- Dexie mute en place l'objet `CardLevelEvent` appelant lors du `bulkAdd`
  (lui ajoute un `id`) — sans conséquence aujourd'hui, aucun appelant ne
  réutilise la référence.
- Reco d'upgrade budgétée : bouton « reco selon mes ressources actuelles »,
  formulaire ponctuel or/gemmes/jokers, store `resourceDeclarations`.
- Analyse du battlelog : winrate, cartes qui font perdre, matchups difficiles,
  sur les combats persistés.
- Widget « progression vers le deck cible » plus riche (courbe dans le temps).
- Courbe de progression des trophées sur l'écran profil (à partir de `syncs`).
- Gestion de plusieurs objectifs successifs et historique des objectifs atteints.

## Priorité basse

- Décider du sort de la voie de test `src/**/*.test.{ts,tsx}` (config jsdom +
  dépendance `jsdom` présentes mais aucun test dessous) : soit ajouter un test
  de fumée sur `App.tsx` (c'est là qu'un vrai bug a été trouvé en revue), soit
  retirer la config/dépendance inutilisées.
- `vite.config.ts` garde un `@ts-ignore` sur la clé `test` — bloqué par un
  décalage de version entre `vite` racine (6.x) et le `vite` embarqué par
  `vitest` (5.x). Se résoudra avec une future mise à jour de `vitest`.
- Scraper méta automatisé (GitHub Action hebdo → `meta-decks.candidates.yaml`
  revu à la main).
- Moteur de substitution de cartes par rôle (taxonomie win condition / sort /
  bâtiment / etc.) pour le deck de transition.
- Évaluer wa-sqlite/OPFS à la place de Dexie si le besoin de vraies requêtes SQL
  apparaît.
- Portage natif Expo/React Native.
- Compte développeur Apple + TestFlight / App Store.
- Comptes utilisateurs + sync multi-appareils via BaaS managé (Supabase/Firebase).
- Partage de decks entre amis, mini-classement privé.
- Notifications (rappel de sync, objectif proche) — nécessite le natif sur iOS.

## Terminé

- 2026-09-03 — Conception : besoins, stack, architecture, 5 sections validées.
- 2026-09-03 — Mise en place : repo GitHub public, fichiers de suivi.
- 2026-09-03 — Phase 1 (Fondations) : scaffold PWA, types du domaine,
  persistance locale (Dexie), relais Cloudflare, client API, synchro,
  UI minimale. 9 tâches + revue finale (1 faille sécurité et plusieurs bugs
  corrigés avant merge, voir DECISIONS.md).

## Comment utiliser ce backlog

Réservoir complet, jamais purgé. Les idées retenues pour une phase passent dans
ROADMAP.md (synthèse priorisée). Quand une idée est livrée, elle descend dans
« Terminé » avec sa date. Rien ne se supprime.
