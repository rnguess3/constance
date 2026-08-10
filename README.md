# Constance

PWA de suivi quotidien de tension artérielle et de glycémie, pensée pour
faciliter le suivi patient/médecin.

## Stack technique

- **Frontend** : React + Vite + Tailwind CSS
- **Backend** : Node.js + Express + Prisma + PostgreSQL
- **Auth** : Clerk
- **PWA** : vite-plugin-pwa

## Structure du projet

```
ConstanceApp/
├── frontend/     # Application React (Vite + Tailwind)
├── backend/      # API Node.js + Express + Prisma
└── README.md
```

## Démarrage rapide

### Backend

```bash
cd backend
npm install
cp .env.example .env   # puis renseigner DATABASE_URL, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY
npm run dev
```

Le serveur backend démarre par défaut sur http://localhost:3001 et expose
une route de santé sur `/health`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # puis renseigner VITE_CLERK_PUBLISHABLE_KEY
npm run dev
```

Les clés Clerk (secrète + publique, la même publique des deux côtés) se
récupèrent sur https://dashboard.clerk.com, dans les "API Keys" de ton
appli.

## Déploiement

Guide complet (Vercel + Railway, variables d'environnement, checklist
d'installabilité PWA) dans [DEPLOYMENT.md](./DEPLOYMENT.md).

## Design system

- **Titres** : Fraunces (500/600)
- **Corps de texte** : IBM Plex Sans
- **Valeurs chiffrées** : IBM Plex Mono
- **Couleurs** : fond papier chaud `#F7F2E9`, accent teal `#1D9E75`,
  accent corail `#D85A30`
