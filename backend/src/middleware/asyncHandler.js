// Express 4 ne rattrape pas automatiquement les erreurs d'une fonction
// async qui échoue (une promesse rejetée dans une route plante la requête
// en silence, sans passer par le gestionnaire d'erreurs). Ce petit
// utilitaire enveloppe un contrôleur async pour transmettre toute erreur
// à next(err), qui la fait remonter jusqu'à errorHandler.js.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
