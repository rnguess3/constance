// Page protégée (accessible seulement via RouteProtegee). Reprend le
// contenu de départ de App.jsx, complété pour montrer le circuit complet
// front <-> back authentifié : récupération d'un token Clerk à jour,
// appel à l'API, et gestion propre d'une session invalide/expirée
// détectée par le backend.
import { useEffect, useState } from 'react';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { appelApi, SessionExpireeError } from '../lib/api.js';

export default function TableauDeBordPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [mesures, setMesures] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function chargerMesures() {
      try {
        // getToken() renvoie toujours un token à jour : Clerk le
        // rafraîchit lui-même en coulisses (les tokens sont volontairement
        // courts, ~60 secondes), donc on le redemande à chaque appel API
        // plutôt que de garder une valeur en mémoire.
        const token = await getToken();
        const donnees = await appelApi('/mesures', { token });
        setMesures(donnees);
      } catch (err) {
        if (err instanceof SessionExpireeError) {
          // Le backend a rejeté le token (expiré/invalide) : on ne
          // montre jamais cette erreur brute à l'utilisateur, on ferme
          // la session locale et on revient proprement à l'écran de
          // connexion.
          await signOut();
          navigate('/connexion', { replace: true });
          return;
        }
        setErreur(err.message);
      }
    }
    chargerMesures();
  }, [getToken, navigate, signOut]);

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="font-display text-4xl font-semibold text-teal">Constance</h1>
      <p className="font-sans text-neutral-700">
        Connecté en tant que {user?.primaryEmailAddress?.emailAddress}
      </p>
      <p className="font-mono text-corail text-2xl">128 / 82</p>

      {erreur && <p className="font-sans text-sm text-corail">{erreur}</p>}
      {mesures !== null && (
        <p className="font-sans text-sm text-neutral-500">
          {mesures.length} mesure(s) enregistrée(s)
        </p>
      )}

      <button
        type="button"
        onClick={() => signOut({ redirectUrl: '/connexion' })}
        className="font-sans text-sm text-neutral-500 underline hover:text-corail"
      >
        Se déconnecter
      </button>
    </main>
  );
}
