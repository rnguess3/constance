// Gestionnaire d'erreurs centralisé, branché en tout dernier dans
// server.js. Express le reconnaît grâce à sa signature à 4 arguments
// (err, req, res, next) et l'appelle pour toute erreur transmise via
// next(err) (notamment via asyncHandler.js).
export function gestionnaireErreurs(err, req, res, next) {
  console.error(err);

  // Erreur Prisma "enregistrement à modifier/supprimer introuvable" :
  // peut survenir si la mesure a été supprimée entre le contrôle
  // d'existence et l'opération elle-même (cas rare mais possible en
  // environnement concurrent).
  if (err.code === 'P2025') {
    return res.status(404).json({ erreur: 'Mesure introuvable' });
  }

  res.status(500).json({ erreur: 'Erreur interne du serveur' });
}
