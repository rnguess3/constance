// Garde d'accès pour les pages qui nécessitent un utilisateur connecté.
//
// useAuth() (Clerk) expose isLoaded (Clerk a fini de vérifier s'il existe
// une session active, ex: cookie de session encore valide) et isSignedIn.
// Tant que isLoaded est false, on ne sait pas encore si l'utilisateur est
// connecté ou non : afficher un écran de connexion à ce stade ferait
// clignoter l'UI à chaque rechargement de page pour un utilisateur déjà
// connecté. On affiche donc un état de chargement neutre en attendant.
import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function RouteProtegee({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center">
        <p className="font-sans text-neutral-500">Chargement…</p>
      </main>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}
