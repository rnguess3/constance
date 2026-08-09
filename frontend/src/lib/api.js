// Petit client HTTP pour appeler le backend Constance.
//
// Rôle par rapport à Clerk : le token envoyé au backend (paramètre
// `token`) doit venir de `await getToken()` (hook useAuth() de Clerk),
// PAS d'une valeur stockée en mémoire ou en localStorage par nous-mêmes —
// Clerk gère seul le rafraîchissement de ce token (il expire au bout de
// ~60 secondes et est automatiquement renouvelé en coulisses). On ne
// stocke donc jamais nous-mêmes de token : on le redemande à chaque
// appel.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Erreur dédiée à un token invalide/expiré (401), pour que les
// composants appelants puissent la distinguer d'une erreur "normale"
// (ex: validation) et réagir en conséquence (redirection vers /connexion)
// plutôt que d'afficher un message d'erreur brut à l'utilisateur.
export class SessionExpireeError extends Error {
  constructor() {
    super('Session expirée ou invalide');
    this.name = 'SessionExpireeError';
  }
}

export async function appelApi(chemin, { token, ...options } = {}) {
  const reponse = await fetch(`${API_URL}${chemin}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (reponse.status === 401) {
    throw new SessionExpireeError();
  }

  if (reponse.status === 204) {
    return null;
  }

  const corps = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    // Erreur "métier" normale (400 de validation, 404...) : on la laisse
    // remonter avec le détail renvoyé par le backend, pour affichage
    // contrôlé par l'appelant.
    const erreur = new Error(corps?.erreur || 'Erreur lors de l’appel à l’API');
    erreur.status = reponse.status;
    erreur.details = corps?.erreurs;
    throw erreur;
  }

  return corps;
}
