// Point d'entrée du serveur backend de Constance.
// Charge les variables d'environnement (.env) avant tout le reste.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mesureRoutes from './routes/mesureRoutes.js';
import { gestionnaireErreurs } from './middleware/errorHandler.js';

const app = express();

// Autorise le frontend (autre port en dev) à appeler cette API.
app.use(cors());
// Permet de lire le JSON envoyé dans le corps des requêtes (req.body).
app.use(express.json());

// Route de santé : sert à vérifier que le serveur tourne (utilisée par
// des outils de monitoring ou simplement pour tester en local).
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'constance-backend' });
});

app.use('/mesures', mesureRoutes);

// Doit rester le DERNIER app.use() : Express l'identifie comme
// gestionnaire d'erreurs grâce à sa signature à 4 arguments, et ne
// l'appelle que pour les erreurs transmises via next(err).
app.use(gestionnaireErreurs);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Serveur Constance démarré sur http://localhost:${PORT}`);
});
