# ERRORS — MyClashRoyale

Bug puis cause puis correctif, cherchable. Ajout uniquement.

## 2026-10-23 — `npm run pages:dev` : « Specify either a directory OR a proxy command, not both »

**Symptôme.** Le script de dev local plantait au démarrage, avant de servir
quoi que ce soit.

**Cause.** `wrangler.toml` déclare `pages_build_output_dir = "dist"`, que
`wrangler pages dev` prend comme dossier à servir ; le script lui passait en
plus une commande à proxifier (`--proxy 5173 -- npm run dev`). Wrangler refuse
les deux à la fois (vérifié dans `node_modules/wrangler`). Le script n'avait
jamais été lancé depuis le scaffold.

**Correctif.** `pages:dev` = `npm run build && wrangler pages dev` : sert
`dist/` + les Functions sur http://localhost:8788 (pas de rechargement à
chaud ; `npm run dev` reste là pour l'UI seule). `APP_ORIGIN` local passé à
8788 dans `.dev.vars.example`.

## 2026-10-23 — Relais : 502 `UPSTREAM_ERROR` sur toutes les routes

**Symptôme.** Avec une vraie clé, `/api/cards` renvoie 502.

**Cause.** `proxy.royaleapi.com` ne résout plus : NXDOMAIN sur 1.1.1.1 et
8.8.8.8 alors que `royaleapi.com` existe. Aucune annonce d'arrêt trouvée ;
le dépôt GitHub associé est archivé depuis 2024. Panne ou fin du service :
inconnu.

**Correctif (partiel).** Variable optionnelle `CLASH_API_BASE` dans le relais :
en local, appel direct à `https://api.clashroyale.com/v1` avec une clé
whitelistée pour l'IP de la machine. La production reste bloquée tant qu'il
n'y a pas d'IP fixe (voir BACKLOG).
