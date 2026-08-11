# Déploiement de Constance

Guide pas à pas pour mettre Constance en ligne. Écrit en supposant que
c'est ton premier déploiement — chaque étape explique le "pourquoi", pas
seulement le "quoi".

## Vue d'ensemble

Trois services séparés, qui doivent se connaître mutuellement par URL :

```
┌─────────────────┐      HTTPS       ┌──────────────────┐      TCP       ┌──────────────┐
│  Frontend (SPA)  │ ───────────────▶ │  Backend (API)   │ ─────────────▶ │  PostgreSQL  │
│  Vercel          │ ◀─────────────── │  Railway         │ ◀───────────── │  Railway     │
└─────────────────┘   CORS + JSON    └──────────────────┘                └──────────────┘
        │                                     │
        └──────────────┬──────────────────────┘
                        ▼
                  Clerk (auth, service tiers — pas hébergé par toi)
```

Le frontend est un tas de fichiers statiques (HTML/JS/CSS) — n'importe
quel hébergeur de sites statiques convient. Le backend, lui, doit tourner
en continu (process Node qui écoute un port, **et** qui fait tourner le
planificateur de rappels en tâche de fond) : il lui faut une vraie
plateforme d'hébergement de serveur, pas un hébergeur statique.

**Pourquoi Vercel plutôt que Netlify pour le frontend** : les deux
conviennent également bien pour un SPA Vite, c'est vraiment un choix de
préférence. Ce guide détaille Vercel parce qu'il faut choisir un chemin
concret plutôt que documenter deux fois la même chose — la logique
(dossier racine, commande de build, variables d'env) se transpose
presque telle quelle sur Netlify si tu préfères.

**Pourquoi Railway plutôt que Render pour le backend — ici c'est un vrai
choix technique, pas une préférence.** Constance envoie des rappels via
un planificateur qui tourne en continu dans le process Express
(`setInterval` toutes les 60s, voir `backend/src/lib/planificateurRappels.js`).
Le plan gratuit de Render **met le service en veille après 15 minutes
sans requête HTTP entrante** et le réveille seulement à la prochaine
requête — pendant qu'il dort, le planificateur ne tourne plus, et les
rappels n'ont silencieusement plus aucune chance de partir à l'heure.
Railway (plan Hobby, à l'usage) ne met pas le service en veille de cette
façon. Si tu changes d'avis plus tard, sache que sur Render il faudrait
soit un plan payant "toujours actif", soit déplacer les rappels vers un
vrai cron externe (ex. un Render Cron Job séparé) — pas juste un détail.

---

## Étape 0 — Mettre le code sur GitHub

Ce repo n'a pas encore de remote Git configuré (`git remote -v` ne
renvoie rien) : Vercel et Railway se connectent tous les deux à un repo
GitHub, il faut donc en créer un d'abord.

1. Sur https://github.com, crée un nouveau repo vide (ne coche PAS
   "Initialize with README" — ce repo local en a déjà un).
2. En local :
   ```bash
   git remote add origin https://github.com/TON-COMPTE/constance.git
   git push -u origin master
   ```
   (ou `main` selon le nom de ta branche par défaut).

Le `.gitignore` exclut déjà `.env`, `node_modules/` et `dist/` — tes
secrets ne partent pas sur GitHub. Vérifie une dernière fois avant de
pousser :
```bash
git status
```
et assure-toi qu'aucun fichier `.env` n'apparaît dans la liste.

---

## Étape 1 — Backend + PostgreSQL sur Railway

### 1.1 Créer le projet et la base de données

1. Crée un compte sur https://railway.app (connexion via GitHub la plus
   simple, ça simplifie aussi l'étape suivante).
2. "New Project" → "Deploy from GitHub repo" → sélectionne ton repo
   `constance`.
3. Railway va détecter un service à la racine du repo — comme ce repo
   contient `frontend/` ET `backend/` côte à côte (pas un monorepo avec
   outillage dédié), il faut lui dire explicitement où est le backend :
   dans les **Settings** du service créé, section **"Root Directory"**,
   mets `backend`.
4. Toujours dans ce projet Railway, clique "New" → "Database" →
   "Add PostgreSQL". Railway provisionne une base et génère automatiquement
   une variable `DATABASE_URL` (visible dans l'onglet "Variables" du
   service Postgres).

### 1.2 Relier le backend à la base

Dans les **Variables** du service *backend* (pas celui Postgres), ajoute
une variable `DATABASE_URL` dont la valeur est une **référence** à celle
du service Postgres plutôt qu'un copier-coller brut — Railway propose ça
automatiquement en tapant `${{` dans le champ valeur, qui te suggère les
variables des autres services du projet (ex. `${{Postgres.DATABASE_URL}}`).
L'intérêt : si Railway fait tourner la base ailleurs ou change le mot de
passe, tu n'as rien à retoucher côté backend.

### 1.3 Build & start command

Déjà préparés dans `backend/package.json` pour cette tâche :
```json
"build": "prisma generate",
"start": "prisma migrate deploy && node src/server.js"
```
Railway détecte Node automatiquement (via Nixpacks) et lance `npm run
build` puis `npm run start` par défaut — donc rien à configurer de plus
ici. `prisma migrate deploy` applique les migrations en attente à chaque
démarrage : c'est ce qui crée/met à jour les tables sur la base de
production la première fois (et à chaque déploiement suivant qui ajoute
une migration).

Railway injecte lui-même une variable `PORT` — inutile de la définir
toi-même, `backend/src/server.js` la lit déjà via
`process.env.PORT || 3001`.

### 1.4 Variables d'environnement à définir sur Railway

Voir la checklist complète en bas de ce document. Une fois le service
déployé, Railway lui attribue une URL publique du type
`https://constance-backend-production.up.railway.app` (visible dans
Settings → "Networking" → "Generate Domain" si ce n'est pas déjà fait) —
note-la, elle sert d'`VITE_API_URL` à l'étape suivante.

Vérifie que ça tourne :
```bash
curl https://TON-URL-RAILWAY.up.railway.app/health
```
doit répondre `{"status":"ok","service":"constance-backend"}`.

---

## Étape 2 — Frontend sur Vercel

1. Crée un compte sur https://vercel.com (connexion GitHub).
2. "Add New" → "Project" → importe le même repo GitHub.
3. Vercel détecte automatiquement un projet Vite, mais comme ici aussi
   frontend/backend cohabitent dans le même repo, il faut préciser le
   **"Root Directory"** dans la configuration du projet (écran d'import,
   ou Settings → General après coup) : `frontend`.
4. Build Command / Output Directory : laisse les valeurs auto-détectées
   (`npm run build` / `dist`) — c'est déjà ce que le preset "Vite" de
   Vercel utilise par défaut.
5. `frontend/vercel.json` (déjà créé) redirige toute URL vers
   `index.html` — indispensable pour un SPA React Router : sans ça,
   recharger la page sur `/historique` en production renverrait un 404
   au lieu de laisser React Router prendre le relai côté client.

### Variables d'environnement à définir sur Vercel

Voir la checklist en bas. Une fois déployé, Vercel te donne une URL du
type `https://constance-xyz.vercel.app`.

### Boucler la connexion frontend ↔ backend

Il y a une dépendance circulaire au premier déploiement : le frontend a
besoin de l'URL du backend (`VITE_API_URL`), et le backend a besoin de
l'URL du frontend (`FRONTEND_URL`, pour n'autoriser QUE cette origine en
CORS — voir `backend/src/server.js`). Ordre à suivre :

1. Déploie d'abord le backend (Étape 1) → récupère son URL Railway.
2. Déploie le frontend (Étape 2) avec `VITE_API_URL` = cette URL Railway.
3. Récupère l'URL Vercel obtenue → retourne dans les Variables Railway du
   backend, mets `FRONTEND_URL` à cette URL Vercel, et redéploie le
   backend (Railway redéploie automatiquement dès qu'une variable
   change).

---

## Étape 3 — Ne pas oublier Clerk

**Correction par rapport à une version précédente de ce guide** : en
vérifiant dans la documentation Clerk avant d'exécuter cette étape, il
s'avère que la section "Domains" du dashboard (et l'ajout manuel d'un
domaine) fait partie du flux de bascule vers une **instance de
production** (clés `pk_live_...`/`sk_live_...`) — ce n'est pas une étape
requise tant que l'app tourne avec des clés `pk_test_.../sk_test_...`
(mode développement). Une instance de développement Clerk est justement
conçue pour fonctionner depuis n'importe quelle origine sans
allowlist à configurer (c'est ce qui permet de tester depuis localhost,
un aperçu Vercel, un domaine de prod, etc. sans rien déclarer) — donc si
`constance` utilise encore ses clés `pk_test_...` actuelles, **il n'y a
probablement rien à faire ici pour que la connexion fonctionne**.

**Vérification la plus fiable : teste directement la connexion sur
l'URL Vercel déployée.** Si le flux de connexion Clerk fonctionne, cette
étape est terminée, sans action dashboard. Si tu obtiens une erreur
Clerk précise au moment de te connecter, note le message exact — ce sera
plus fiable pour diagnostiquer que d'anticiper une cause.

Quand tu voudras passer à de vrais utilisateurs (pas juste un test), il
faudra à ce moment-là créer une instance de **production** dans Clerk
(clés `pk_live_...`/`sk_live_...`), ce qui implique cette fois un vrai
enregistrement de domaine avec des enregistrements DNS dédiés (CNAME) —
une étape plus lourde qu'un simple ajout dans une liste, à traiter
séparément quand ce sera le moment, pas comme un pré-requis du premier
déploiement de test.

---

## Checklist des variables d'environnement

Les valeurs elles-mêmes ne sont **jamais** dans ce fichier ni dans le
code — seulement leur nom et où aller chercher la valeur. Renseigne-les
directement dans les interfaces Railway / Vercel (sections "Variables" /
"Environment Variables").

### Railway (service backend)

| Variable | D'où vient la valeur |
|---|---|
| `DATABASE_URL` | Référence auto-générée vers le service Postgres du même projet Railway (`${{Postgres.DATABASE_URL}}`) |
| `FRONTEND_URL` | URL Vercel de production (ex. `https://constance-xyz.vercel.app`) — à mettre à jour APRÈS le déploiement Vercel |
| `CLERK_SECRET_KEY` | dashboard.clerk.com → ton appli → API Keys (clé secrète — jamais côté frontend) |
| `CLERK_PUBLISHABLE_KEY` | dashboard.clerk.com → ton appli → API Keys (même valeur publique que côté frontend) |
| `VAPID_PUBLIC_KEY` | Déjà généré en local avec `npx web-push generate-vapid-keys` (voir `backend/.env` local) — réutilise la MÊME paire de clés qu'en dev, ne la régénère pas : ça invaliderait tous les abonnements push déjà enregistrés |
| `VAPID_PRIVATE_KEY` | Idem — la clé privée correspondante |
| `VAPID_SUBJECT` | Un `mailto:` ou une URL `https://` de contact (obligatoire par la spec Web Push) |

`PORT` n'est PAS à définir : Railway l'injecte automatiquement.

### Vercel (projet frontend)

| Variable | D'où vient la valeur |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | dashboard.clerk.com → ton appli → API Keys (clé publique, même valeur que `CLERK_PUBLISHABLE_KEY` côté Railway) |
| `VITE_API_URL` | URL publique du backend Railway (ex. `https://constance-backend-production.up.railway.app`) |
| `VITE_VAPID_PUBLIC_KEY` | La MÊME valeur que `VAPID_PUBLIC_KEY` côté Railway (clé publique, sans risque à exposer côté client) |

---

## Vérifier l'installabilité PWA (Chrome DevTools)

Une fois le frontend déployé sur une vraie URL HTTPS (ou en local sur
`http://localhost:5173`, qui compte comme "contexte sécurisé" pour ces
critères) :

1. Ouvre l'app dans Chrome, `F12` → onglet **Application**.
2. **Manifest** (dans le menu de gauche) : vérifie qu'il n'y a aucune
   erreur affichée en rouge, que "Name"/"Short name" sont bien
   "Constance", que les icônes 192×192 et 512×512 apparaissent avec un
   aperçu correct, et que "Theme color" affiche bien le teal `#1D9E75`.
3. **Service Workers** : vérifie qu'un service worker est listé avec le
   statut "activated and is running".
4. Dans la barre d'adresse, une icône d'installation (⊕ ou similaire)
   doit apparaître si tous les critères sont réunis. Si elle
   n'apparaît pas : onglet **Lighthouse** → coche uniquement "Progressive
   Web App" → "Analyze page load" → le rapport liste précisément le
   critère manquant (c'est le diagnostic le plus fiable, plus lisible que
   de deviner).

Les critères Chrome pour l'icône d'installation, en résumé : manifest
valide avec `name`/`short_name`, icône ≥192×192 ET ≥512×512, `start_url`
qui répond, service worker avec un handler `fetch`, et HTTPS (ou
localhost). Tout est déjà en place dans cette config.

---

## Avant de considérer le MVP terminé

Deux choses que je ne peux pas vérifier à ta place depuis cet
environnement (pas d'outil navigateur/mobile ici) — à faire une fois le
déploiement en ligne :

- **Mode hors-ligne** : coupe le réseau (mode avion, ou onglet Network →
  "Offline" dans Chrome DevTools) puis navigue dans l'app déjà ouverte —
  vérifie que le shell se charge toujours et qu'une nouvelle mesure
  saisie hors-ligne part bien en file d'attente (voir le badge sur
  l'onglet "Saisir"). Recharge la page sur une route profonde
  (`/historique`) pendant que tu es hors-ligne : ça doit fonctionner
  grâce à la route de secours ajoutée dans `src/sw.js`.
- **Installation mobile** : sur Android (Chrome), utilise le menu ⋮ →
  "Installer l'application" ; sur iPhone/iOS (Safari uniquement — Chrome
  iOS ne peut pas installer de PWA), bouton Partager → "Sur l'écran
  d'accueil". Vérifie que l'icône installée est la bonne, que l'app
  s'ouvre en plein écran (sans barre d'adresse Safari/Chrome), et — si tu
  testes les rappels sur iOS — que c'est bien fait *depuis cette icône
  installée*, pas depuis un onglet Safari classique (voir les limites
  iOS déjà documentées dans `ReglagesPage.jsx`).
