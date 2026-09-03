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
