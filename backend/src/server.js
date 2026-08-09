// Point d'entrée du serveur backend de Constance.
// Charge les variables d'environnement (.env) avant tout le reste.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Serveur Constance démarré sur http://localhost:${PORT}`);
});
