// Ossature commune des écrans protégés : petite barre du haut (accès à
// l'historique + utilisateur connecté + déconnexion), zone de contenu
// (Outlet = Saisir/Historique/Tendances/Export selon la route), et
// navigation basse. La synchronisation hors-ligne est déclenchée une
// seule fois ici (pas dans chaque page) pour éviter plusieurs écouteurs
// "online" en parallèle ; les pages y accèdent via useOutletContext().
//
// L'historique n'est volontairement pas un 4e onglet de la navigation
// basse : la maquette validée en fixe 3 (Saisir/Tendances/Export). On y
// accède donc depuis ce lien, visible sur tous les écrans.
import { Outlet, Link } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import NavigationBasse from './NavigationBasse.jsx';
import { useSynchronisation } from '../hooks/useSynchronisation.js';

export default function MiseEnPagePrincipale() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { nombreEnAttente, rafraichirCompteur } = useSynchronisation();

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between gap-2 px-4 py-2">
        <Link to="/historique" className="font-sans text-xs font-medium text-teal underline">
          Historique
        </Link>
        <div className="flex items-center gap-3">
          <span className="truncate font-sans text-xs text-neutral-500">
            {user?.primaryEmailAddress?.emailAddress}
          </span>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/connexion' })}
            className="shrink-0 font-sans text-xs text-neutral-500 underline hover:text-corail"
          >
            Se déconnecter
          </button>
        </div>
      </header>

      <Outlet context={{ nombreEnAttente, rafraichirCompteurEnAttente: rafraichirCompteur }} />

      <NavigationBasse nombreEnAttente={nombreEnAttente} />
    </div>
  );
}
