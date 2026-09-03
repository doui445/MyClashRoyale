# BACKLOG — MyClashRoyale

Réservoir brut de toutes les idées. Jamais purgé, seulement archivé.

## Priorité haute

- **MVP — suggestion de deck** (voir ROADMAP pour le découpage) : scaffold,
  relais API, persistance locale, synchro, pipeline méta, moteur de reco,
  écrans, déploiement PWA.
- Table « niveau de carte attendu par palier de trophées » (`data/tier-levels.yaml`)
  à remplir — curation par l'auteur.
- Table des coûts d'upgrade par niveau/rareté (`data/upgrade-costs.yaml`) —
  données statiques du jeu à saisir.
- Premier `data/meta-decks.yaml` : quelques decks par palier pour démarrer.

## Priorité moyenne

- Reco d'upgrade budgétée : bouton « reco selon mes ressources actuelles »,
  formulaire ponctuel or/gemmes/jokers, store `resourceDeclarations`.
- Analyse du battlelog : winrate, cartes qui font perdre, matchups difficiles,
  sur les combats persistés.
- Widget « progression vers le deck cible » plus riche (courbe dans le temps).
- Courbe de progression des trophées sur l'écran profil (à partir de `syncs`).
- Gestion de plusieurs objectifs successifs et historique des objectifs atteints.

## Priorité basse

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

## Comment utiliser ce backlog

Réservoir complet, jamais purgé. Les idées retenues pour une phase passent dans
ROADMAP.md (synthèse priorisée). Quand une idée est livrée, elle descend dans
« Terminé » avec sa date. Rien ne se supprime.
