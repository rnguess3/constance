// Déclenche automatiquement la synchronisation de la file d'attente
// hors-ligne : au chargement de l'app et à chaque retour de connexion
// (événement navigateur "online"). Expose aussi le nombre de mesures en
// attente pour affichage (petit badge/bannière), et une fonction pour
// forcer une tentative manuelle.
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { compterMesuresEnAttente } from '../lib/mesuresHorsLigne.js';
import { synchroniserMesuresEnAttente } from '../lib/synchronisation.js';

export function useSynchronisation() {
  const { getToken } = useAuth();
  const [nombreEnAttente, setNombreEnAttente] = useState(0);
  const [synchronisationEnCours, setSynchronisationEnCours] = useState(false);

  const rafraichirCompteur = useCallback(async () => {
    setNombreEnAttente(await compterMesuresEnAttente());
  }, []);

  const synchroniser = useCallback(async () => {
    if (!navigator.onLine) return;
    setSynchronisationEnCours(true);
    try {
      await synchroniserMesuresEnAttente(getToken);
    } finally {
      await rafraichirCompteur();
      setSynchronisationEnCours(false);
    }
  }, [getToken, rafraichirCompteur]);

  useEffect(() => {
    rafraichirCompteur();
    synchroniser();

    window.addEventListener('online', synchroniser);
    return () => window.removeEventListener('online', synchroniser);
  }, [synchroniser, rafraichirCompteur]);

  return { nombreEnAttente, synchronisationEnCours, synchroniser, rafraichirCompteur };
}
