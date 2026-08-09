// Middleware d'authentification TEMPORAIRE.
//
// L'app finale utilisera Clerk ou Supabase Auth (choix pas encore fait)
// pour authentifier l'utilisateur à partir d'un token vérifié
// cryptographiquement. En attendant cette intégration, on simule
// l'utilisateur connecté via un header "x-user-id" envoyé par le client.
//
// ATTENTION : ce n'est PAS sécurisé. N'importe qui peut mettre le
// x-user-id de son choix dans une requête et se faire passer pour
// n'importe quel utilisateur. Ce middleware ne doit jamais être utilisé
// tel quel en production — il permet seulement de développer et tester
// les routes /mesures avant que l'auth réelle ne soit branchée.
export function authTemporaire(req, res, next) {
  const userId = req.header('x-user-id');

  if (!userId) {
    return res.status(401).json({
      erreur: 'Header x-user-id requis (authentification temporaire en attendant Clerk/Supabase)',
    });
  }

  req.userId = userId;
  next();
}
