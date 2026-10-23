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
- Icône de l'app (couronne dorée sur fond bleu nuit) : favicon, icônes du
  manifeste (dont « maskable » Android) et icône d'écran d'accueil iOS.
- Préparation du déploiement Cloudflare Pages branché sur GitHub :
  `APP_ORIGIN` de production dans `wrangler.toml`, procédure dans le README.
- Variable optionnelle `CLASH_API_BASE` du relais, pour appeler l'API
  officielle directement en local quand le proxy RoyaleAPI est injoignable.
- Mention « application de fan non officielle, non affiliée à Supercell »
  dans le README.

### Changé

- L'app s'appelle désormais **MyCR** (nom affiché, manifeste, titre, nom du
  paquet, projet Cloudflare `mycr`, base locale IndexedDB `mycr`).

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
- `npm run pages:dev` plantait au démarrage (conflit entre le dossier de
  sortie de `wrangler.toml` et le mode proxy).
- Niveaux de cartes affichés 2 niveaux trop bas : l'échelle du jeu est 1..16,
  pas 1..14 (confirmé sur une vraie réponse API) ; repli de rareté recalé.
- Une seule étoile pour « évolution ou héros » : le profil distingue
  désormais ✦ évolution et 👑 héros (code additif de l'API décodé).
