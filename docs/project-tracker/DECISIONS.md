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
