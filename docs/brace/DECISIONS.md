# DECISIONS — MyClashRoyale

Pourquoi chaque choix structurel, et ce qui a été écarté. Ajout uniquement.

## 2026-09-03 — Architecture local-first (PWA), pas de backend applicatif

**Contexte** : app pour 2 utilisateurs au départ, l'auteur ne veut pas
maintenir de serveur. L'API Clash Royale impose une clé secrète liée à une IP
fixe.

**Choix** : PWA React qui tourne sur le téléphone, données en IndexedDB, aucune
auth. Une seule brique cloud : une fonction serverless (Cloudflare Pages
Function) qui détient la clé API et relaie les appels via `proxy.royaleapi.com`.

**Écarté** :
- *Backend FastAPI/Node + Postgres sur IP fixe* (l'approche de la 1re conv) :
  serveur à maintenir, coût, sur-dimensionné pour le besoin.
- *Next.js full-stack sur Vercel* : viable, mais un serveur applicatif reste
  dans la boucle ; la PWA local-first est plus proche du « rien à maintenir ».
- *App native Expo maintenant* : nécessite un compte Apple à 99 $/an pour une
  install propre ; reporté à la phase publique.

**Inconvénient accepté** : stockage PWA sur iOS potentiellement purgé par le
système ; pas de notifications push ; ressenti légèrement moins natif. Mitigé
par `storage.persist()` et le fait que profil + battlelog se re-téléchargent.

## 2026-09-03 — Logique métier isolée dans `core/` (TS pur)

**Contexte** : portage natif (Expo) envisagé à terme.

**Choix** : `core/` (reco, sync, méta, domaine) sans dépendance React ni
navigateur ; `storage/` derrière une interface `Repository`. `app/` ne fait que
du rendu.

**Écarté** : logique dans les composants React (rapide au début, mais rend le
port natif coûteux et les tests plus lourds).

**Inconvénient accepté** : un peu plus de cérémonie (interfaces, injection) dès
le départ.

## 2026-09-03 — Decks méta curés à la main, pas de scraping automatique

**Contexte** : l'auteur connaît la méta ; RoyaleAPI déconseille le scraping de
son site.

**Choix** : `data/meta-decks.yaml` édité à la main → validé et publié en JSON
par la CI. Le scraper (v2) ne produira que des *candidats* à revoir à la main.

**Écarté** : scraping automatique publié directement (risque qualité + ToS).

**Inconvénient accepté** : la fraîcheur de la méta dépend de la disponibilité de
l'auteur.

## 2026-09-03 — Sélection de deck séquentielle, match partiel si collection incomplète

**Contexte** : deux décisions de calibrage du moteur de reco.

**Choix** :
- Sélection **séquentielle** : on fixe d'abord le deck final (meilleur pour
  l'objectif), puis le deck de transition le plus proche que le joueur possède.
- Si le joueur ne possède aucun deck méta complet : **match partiel** (deck le
  plus proche possédé à ≥ 6/8) + affichage des cartes manquantes.

**Écarté** :
- *Sélection conjointe* (évaluer toutes les paires transition/final) : meilleur
  alignement théorique, mais complexité en plus pour un gain marginal sur
  ~30-40 decks.
- *Moteur de substitution par rôle* : demanderait une taxonomie de rôles de
  cartes à curer ; reporté.

**Inconvénient accepté** : le deck de transition proposé peut être sous-optimal
si un meilleur couple existait via une recherche conjointe.

## 2026-09-04 — Validation du relais et normalisation reportées faute de clé API

**Contexte** : les Tâches 7 (client `core/clash-api`) et 9 (test manuel de
bout en bout) du plan Fondations demandaient de valider le mapping et le
relais contre une vraie réponse de l'API Clash Royale — aucune clé de dev
n'est disponible dans l'environnement d'exécution.

**Choix** : construire des fixtures synthétiques documentées comme telles
(noms de cartes réels, données joueur inventées), avec les hypothèses de
mapping (`normalizeCardLevel`, repli `rarityFromMaxLevel`) explicitement
commentées comme non vérifiées, plutôt que de bloquer l'exécution du plan.

**Écarté** : attendre l'obtention d'une clé avant de continuer — aurait
arrêté toute la phase 1 sur une dépendance externe hors du contrôle de la
session.

**Inconvénient accepté** : le mapping cartes↔niveaux n'est pas garanti
correct tant qu'il n'a pas été revérifié contre une vraie réponse API (suivi
en BACKLOG priorité haute).

## 2026-09-04 — Revue finale : périmètre du lot de correctifs avant merge

**Contexte** : la revue finale de toute la branche (phase 1) a remonté 1
faille critique, 6 défauts importants et 9 mineurs, plus un triage de points
mineurs laissés de côté en cours de tâches. Un seul lot de correctifs est
possible dans le processus suivi (pas de deuxième tour).

**Choix** — corrigés avant merge :
- Faille de sécurité : validation du tag dans le relais Cloudflare (le
  paramètre n'était pas vérifié avant d'être injecté dans l'URL amont —
  risque d'accès à des routes arbitraires de l'API en portant la clé secrète,
  sur un dépôt public).
- Ordre d'écriture de la synchro (les événements de montée de niveau sont
  maintenant écrits avant l'état courant des cartes, pour qu'un échec
  partiel ne perde plus l'historique).
- Garde anti-double-synchro (React StrictMode déclenchait deux synchros
  concurrentes en développement).
- Correction de l'échelle niveau/niveau-max des cartes (affichage
  incohérent type « niv. 9/6 »).
- Deux nettoyages peu coûteux repérés en cours de tâches (gestion d'erreur
  JSON malformé côté client API, accessibilité du champ de saisie du tag).
- Mise à jour du README (statut, structure, procédure d'installation/déploiement).
- Deux nettoyages triviaux de tests (fermeture de connexion Dexie en test).

**Écarté (repoussé en BACKLOG, pas abandonné en silence)** :
- Transaction complète sur l'écriture de synchro (`Repository.applySync`) —
  la version corrigée (ordre sûr) couvre le risque immédiat, la vraie
  solution demande d'étendre l'interface `Repository`.
- Persistance complète du profil joueur (nom, meilleur score) + suppression
  du second appel réseau redondant dans `useSync` — nécessaire pour que le
  mode hors ligne fonctionne vraiment, mais c'est un changement de schéma et
  de forme de retour, pas un correctif ponctuel.
- Normalisation ISO du format de date des combats (`Battle.at`) — rien ne
  casse encore, latent jusqu'au premier calcul de date en phase 3.
- Un correctif trivial (`@ts-ignore` dans `vite.config.ts`) n'a **pas** pu
  être appliqué : `vitest` embarque une version de `vite` incompatible avec
  celle du projet — bloqué sur une future mise à jour de dépendance, pas une
  décision de conception.
- Une dizaine de points mineurs (voir BACKLOG : throttling de synchro,
  `APP_ORIGIN` en prod, `OPTIONS` sur toutes les routes du relais, ordre de
  `getBattles()`, etc.).

**Inconvénient accepté** : le mode hors ligne de l'architecture « local-first »
n'est pas encore pleinement fonctionnel (un profil jamais synchronisé avec
succès en ligne ne peut pas s'afficher hors ligne) — accepté pour cette
phase car ce n'était pas l'objectif affiché du plan Fondations (« saisir un
tag → synchro → profil affiché »), mais c'est la priorité haute du backlog.

## 2026-10-23 — Icônes générées une fois, pas de générateur en dépendance

**Contexte.** Le manifeste PWA n'avait aucune icône (`icons: []`) : sur
iPhone, « Sur l'écran d'accueil » aurait affiché une capture floue.

**Décision.** Un seul fichier source, `public/logo.svg` (couronne dessinée à
la main, pas de reprise du logo Supercell). Les PNG (64/192/512, maskable 512,
apple-touch 180) sont générés **une fois** avec `sharp` dans un script jetable
hors du dépôt, et seuls les PNG sont commités. Fond bleu nuit `#1e293b` (celui
de l'app) sur les icônes opaques iOS et maskable.

**Alternative écartée.** `@vite-pwa/assets-generator`, l'outil officiel :
il épingle `sharp@0.32`, qui a des vulnérabilités connues (libvips, librsvg)
et dont l'installation a échoué ici. Pas justifié pour une opération faite
une fois.

## 2026-10-23 — Déploiement avancé avant les phases 2-3, branché sur GitHub

**Décision.** Le déploiement Cloudflare Pages (étape 9 de la ROADMAP) est
avancé pour pouvoir installer l'app sur iPhone tôt. Intégration Git (chaque
push sur `main` redéploie) plutôt qu'envoi manuel `wrangler pages deploy`.
`wrangler.toml` étant présent, il fait foi pour la config Pages : `APP_ORIGIN`
y est déclaré en `[vars]` ; la clé API reste un secret Cloudflare.

**Coût.** Plan gratuit : fichiers statiques illimités, 100 000 appels de
Functions/jour, 500 builds/mois — très au-dessus de l'usage prévu ; au-delà,
les appels sont refusés jusqu'à minuit UTC, rien n'est facturé.

## 2026-10-23 — L'app s'appelle MyCR, sans le nom du jeu dans l'adresse

**Contexte.** « Clash Royale Coach » / « CR Coach » n'était qu'un nom de
travail, repris du titre de la conversation d'origine. Une appli proche,
« Royale Coach », existe sur l'App Store. Surtout, la charte des contenus de
fans de Supercell interdit les noms de domaine contenant le nom de leurs jeux
sans accord écrit : l'adresse prévue `clash-royale-coach.pages.dev` posait
problème.

**Décision.** Nom **MyCR** partout : nom affiché et nom court (tient sous
l'icône iOS), titre, paquet npm, projet Cloudflare et adresse
`mycr.pages.dev`, base IndexedDB. La base locale a été renommée maintenant
parce que l'app n'est encore installée nulle part : plus tard, ce changement
aurait fait perdre l'historique des joueurs. Mention « non officielle, non
affiliée à Supercell » ajoutée au README. Le nom « Clash Royale » reste
utilisé dans les textes uniquement pour désigner le jeu.

**Alternative écartée.** Garder « CR Coach » : pas de conflit bloquant (app
privée, hors App Store), mais nom générique, proche d'un concurrent, et
adresse à changer de toute façon.

## 2026-10-23 — Relais maison à IP fixe (Caddy sur Oracle Cloud gratuit)

**Contexte.** Supercell exige une IP déclarée par clé ; les fonctions
Cloudflare n'en ont pas de fixe. Le proxy RoyaleAPI prévu à l'origine a
disparu (ERRORS.md).

**Décision.** Un relais à nous, dans `relay/` : un **Caddy** configuré (pas de
code applicatif) sur une VM **Oracle Cloud Always Free**, nom de domaine
gratuit `<ip>.sslip.io` pour le HTTPS automatique. Le relais ne détient
**aucune** clé Supercell : il transmet l'en-tête `Authorization` de la
fonction, ce qui garde la clé à un seul endroit (Cloudflare). Il n'accepte que
des `GET /v1/*` portant un secret partagé `X-Relay-Key` (sinon `403`), pour ne
pas être un relais ouvert vers l'API depuis notre IP. L'adresse du relais et
sa clé sont des secrets Cloudflare (`CLASH_API_BASE`, `RELAY_KEY`), pas des
`[vars]` de `wrangler.toml` : le dépôt est public. Sans `CLASH_API_BASE`, la
fonction appelle désormais l'API officielle directement (usage local) au lieu
de l'ancien proxy mort.

**Alternatives écartées.** Attendre le retour du proxy RoyaleAPI (dépendance
à un tiers, choix de l'auteur de faire le sien) ; le Mac comme relais (app
hors service quand il est éteint, machine exposée sur internet) ; un VPS payant
(~4 €/mois, inutile tant qu'Oracle suffit) ; un relais en Node (du code à
maintenir pour ce que Caddy fait en 20 lignes).

**Risque connu.** Oracle peut récupérer une instance gratuite jugée inactive ;
parade décrite dans `relay/README.md`.
