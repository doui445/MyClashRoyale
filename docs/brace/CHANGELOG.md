# Changelog — MyClashRoyale

Format basé sur Keep a Changelog.

## Non publié

### Ajouté

- Document de conception initial (architecture local-first, modèle de données,
  moteur de suggestion de deck, synchro API Clash Royale, pipeline decks méta).
- Plan d'implémentation de la phase 1 (Fondations) — 9 tâches TDD.
- Fichiers de suivi de projet.
- Dépôt GitHub public.
- **Phase 1 (Fondations)** : scaffold PWA (Vite/React/TS/vite-plugin-pwa) ;
  types du domaine ; persistance locale (interface `Repository`, impl mémoire
  et Dexie/IndexedDB) ; relais Cloudflare Pages Function vers l'API Clash
  Royale (secret côté serveur, cache 60 s, validation du tag, gestion
  d'erreurs réseau/HTTP) ; client `core/clash-api` (mapping, normalisation de
  niveau) ; orchestrateur de synchro `core/sync` (diff des niveaux de cartes,
  dédup des combats) ; UI minimale (onboarding, écran profil/battlelog).

### Corrigé

- Faille de sécurité : le relais Cloudflare n'validait pas le tag joueur
  avant de l'utiliser dans l'URL amont, permettant une injection de segments
  de chemin vers des routes arbitraires de l'API en portant la clé secrète.
- Niveau et niveau maximum d'une carte affichés sur deux échelles
  différentes (ex. « niv. 9/6 » pour une légendaire).
- Ordre d'écriture de la synchro pouvant perdre l'historique de montée de
  niveau en cas d'échec partiel.
- Double déclenchement de la synchro en développement (React StrictMode)
  provoquant des doublons en base.
- Configuration `tsconfig` (project references / composite / noEmit) mal
  posée initialement, causant des artefacts compilés committés par erreur.
- Absence de gestion des erreurs réseau dans le relais Cloudflare.
- Écran bloquant sans retour possible à l'onboarding après un tag rejeté.
