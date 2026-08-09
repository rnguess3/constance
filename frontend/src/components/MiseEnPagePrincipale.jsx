// Ossature commune des écrans protégés : petite barre du haut
// (utilisateur connecté + déconnexion), zone de contenu (Outlet =
// Saisir/Tendances/Export selon la route), et navigation basse. La
// synchronisation hors-ligne est déclenchée une seule fois ici (pas
// dans chaque page) pour éviter plusieurs écouteurs "online" en
// parallèle ; les pages y accèdent via useOutletContext().
import { Outlet } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import NavigationBasse from './NavigationBasse.jsx';
import { useSynchronisation } from '../hooks/useSynchronisation.js';

export default function MiseEnPagePrincipale() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { nombreEnAttente, rafraichirCompteur } = useSynchronisation();

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between px-4 py-2">
        <span className="font-sans text-xs text-neutral-500">
          {user?.primaryEmailAddress?.emailAddress}
        </span>
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: '/connexion' })}
          className="font-sans text-xs text-neutral-500 underline hover:text-corail"
        >
          Se déconnecter
        </button>
      </header>

      <Outlet context={{ nombreEnAttente, rafraichirCompteurEnAttente: rafraichirCompteur }} />

      <NavigationBasse nombreEnAttente={nombreEnAttente} />
    </div>
  );
}
