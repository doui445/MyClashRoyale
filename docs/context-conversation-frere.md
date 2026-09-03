# Clash Royale Coach — Résumé du projet

## Vision

Application web permettant de :
- Se connecter à son compte Clash Royale (via tag joueur)
- Recevoir des recommandations personnalisées : quelles cartes améliorer en priorité, quel deck utiliser, selon les ressources disponibles (or, gemmes, jokers) et l'objectif de trophées
- Analyser l'historique de combats pour identifier les points faibles

**Cas d'usage type** : un joueur qui reprend le jeu après une longue pause (ex: 5 ans), avec des cartes sous-développées par rapport à la méta actuelle, veut savoir précisément quoi faire — farmer de l'or pour telle carte, jouer tel deck de transition, viser tel deck final — pour progresser efficacement vers un objectif de trophées.

## Contraintes techniques identifiées

- **API Clash Royale officielle** (developer.clashroyale.com) : accès en lecture seule au profil joueur (cartes, niveaux, trophées) et au battlelog (25 derniers combats). Authentification par tag joueur, pas de mot de passe de jeu.
- **Clé API liée à une IP fixe** — impose un backend hébergé sur IP statique (Railway/Render), exclut les fonctions serverless classiques pour cette partie.
- **Non disponible via l'API** : or, gemmes, jokers (chest cycle), et détail des inputs/actions d'un replay (pas d'analyse "frame par frame"). Ces données doivent être déclarées manuellement par l'utilisateur.
- **Decks meta** : alimentés manuellement au lancement (curation à la main par palier de trophées), avec extension possible plus tard via API/scraping externe.

## Stack retenue

| Composant | Choix | Raison |
|---|---|---|
| Frontend | Next.js (React) | Web responsive, déploiement simple (Vercel) |
| Backend | Python + FastAPI | Logique de recommandation calculatoire, évolutif vers du ML, doc API auto-générée |
| ORM / migrations | SQLAlchemy + Alembic | Migrations versionnées, aligné sur le SQL écrit à la main |
| Base de données | PostgreSQL | Relationnel, robuste, bien supporté par tous les hébergeurs |
| Auth | Email / mot de passe (JWT + sessions révocables) | Simplicité pour l'utilisateur, sécurité via hash argon2 |
| Hébergement (cible) | Backend : Railway/Render (IP fixe) · Frontend : Vercel · DB : Supabase/Neon | Adapté à la contrainte d'IP fixe de l'API Clash Royale |

## Schéma de base de données (11 tables)

- **`users`** — compte (email, mot de passe hashé, tag Clash Royale)
- **`auth_sessions`** — sessions actives, révocables à distance
- **`user_goals`** — objectifs de trophées successifs (un seul actif à la fois, contrainte en base)
- **`player_profile_snapshots`** — historique des trophées / king level dans le temps
- **`card_level_events`** — événements de changement de niveau de carte (pas de snapshot à chaque sync : uniquement quand un niveau ou un nombre de copies change réellement, pour un historique léger et des courbes de progression faciles à calculer)
- **`cards`** — catalogue de référence des cartes du jeu
- **`resource_declarations`** — or / gemmes / jokers déclarés manuellement par l'utilisateur, historisés
- **`meta_decks`** + **`meta_deck_cards`** — base de connaissance des decks compétitifs par palier de trophées
- **`recommendations`** — historique des recommandations générées par l'algo
- **`battle_logs`** — historique de combats récupéré via l'API

Détails complets, contraintes et justification de chaque choix : `db/migrations/001_init_schema.sql`.

## État d'avancement du backend

✅ **Fait et testé** :
- Migration SQL complète (11 tables, contraintes d'intégrité, index)
- Structure du projet en couches (`models` / `schemas` / `api` / `services` / `core` / `db`)
- Configuration Alembic (migrations versionnées, alignées sur le SQL)
- Authentification complète : inscription, connexion, JWT, route protégée `/users/me`
- Intégration API Clash Royale : client HTTP dédié, association du tag joueur, synchronisation du profil (`POST /users/me/sync`)
- Logique de détection de changement de niveau de carte validée par des tests unitaires (pas de doublon si rien ne change, historique conservé si un niveau évolue)

🔜 **Reste à faire** :
- Persister le battlelog en base (`battle_logs`)
- Moteur de recommandation (priorisation d'upgrade selon ressources, suggestion de deck selon palier de trophées et objectif) — cœur de la valeur du produit
- Frontend (Next.js)
- Peuplement initial du catalogue de decks meta (`meta_decks`)
- Déploiement (backend à IP fixe, base Postgres managée)

## Fichiers livrés

Projet complet (backend FastAPI + migration SQL) livré sous forme d'archive `clash-coach-backend.zip`, avec un `README.md` expliquant comment lancer le projet en local (installation, configuration `.env`, migration, lancement du serveur).
