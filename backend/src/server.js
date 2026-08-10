// Point d'entrée du serveur backend de Constance.
// Charge les variables d'environnement (.env) avant tout le reste.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mesureRoutes from './routes/mesureRoutes.js';
import rappelRoutes from './routes/rappelRoutes.js';
import { gestionnaireErreurs } from './middleware/errorHandler.js';
import { analyserAuthentification } from './middleware/clerkAuth.js';
import { demarrerPlanificateurRappels } from './lib/planificateurRappels.js';

const app = express();

// Autorise uniquement le frontend (FRONTEND_URL) à appeler cette API, y
// compris l'en-tête Authorization qui transporte le token Clerk. Sans
// "origin" explicite, cors() accepte n'importe quelle origine — tolérable
// en dev local, mais pas une fois l'API exposée publiquement en
// production : un site tiers pourrait sinon appeler l'API au nom d'un
// utilisateur dont le navigateur détient un token valide.
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
// Permet de lire le JSON envoyé dans le corps des requêtes (req.body).
app.use(express.json());

// Doit être monté globalement, avant les routes : lit le token Clerk
// présent sur CHAQUE requête (s'il y en a un) pour le rendre disponible
// via getAuth(req). Ne bloque rien à ce stade — c'est
// exigerUtilisateurConnecte (dans mesureRoutes.js) qui refuse l'accès
// si aucun utilisateur valide n'a été trouvé.
app.use(analyserAuthentification);

// Route de santé : sert à vérifier que le serveur tourne (utilisée par
// des outils de monitoring ou simplement pour tester en local).
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'constance-backend' });
});

app.use('/mesures', mesureRoutes);
app.use('/rappels', rappelRoutes);

// Doit rester le DERNIER app.use() : Express l'identifie comme
// gestionnaire d'erreurs grâce à sa signature à 4 arguments, et ne
// l'appelle que pour les erreurs transmises via next(err).
app.use(gestionnaireErreurs);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Serveur Constance démarré sur http://localhost:${PORT}`);
  demarrerPlanificateurRappels();
});
