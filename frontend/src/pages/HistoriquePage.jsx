// Historique des mesures : liste chronologique inversée, groupée par
// jour, avec filtre par type, édition (réouvre l'écran de saisie
// pré-rempli) et suppression (confirmation inline sur chaque ligne, voir
// MesureLigne.jsx).
import { useEffect, useMemo, useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import FiltreType from '../components/historique/FiltreType.jsx';
import GroupeJour from '../components/historique/GroupeJour.jsx';
import EtatVide from '../components/EtatVide.jsx';
import MessageRetour from '../components/MessageRetour.jsx';
import { appelApi, SessionExpireeError } from '../lib/api.js';
import { grouperParJour } from '../lib/formatage.js';

const LABEL_FILTRE = { tension: 'tension', glycemie: 'glycémie' };

export default function HistoriquePage() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [filtre, setFiltre] = useState('tout');
  // null = chargement en cours ; tableau = chargé (vide ou non)
  const [mesures, setMesures] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let annule = false;

    async function charger() {
      setMesures(null);
      setErreur('');
      try {
        const token = await getToken();
        const chemin = filtre === 'tout' ? '/mesures' : `/mesures?type=${filtre}`;
        const donnees = await appelApi(chemin, { token });
        if (!annule) setMesures(donnees);
      } catch (err) {
        if (err instanceof SessionExpireeError) {
          await signOut();
          navigate('/connexion', { replace: true });
          return;
        }
        if (!annule) setErreur(err.message || 'Impossible de charger l’historique.');
      }
    }

    charger();
    return () => {
      annule = true;
    };
  }, [filtre, getToken, navigate, signOut]);

  const groupes = useMemo(() => (mesures ? grouperParJour(mesures) : []), [mesures]);

  function gererEdition(mesure) {
    navigate(`/mesures/${mesure.id}/modifier`, { state: { mesure } });
  }

  async function gererSuppression(id) {
    const token = await getToken();
    try {
      await appelApi(`/mesures/${id}`, { method: 'DELETE', token });
      setMesures((precedent) => precedent.filter((m) => m.id !== id));
    } catch (err) {
      if (err instanceof SessionExpireeError) {
        await signOut();
        navigate('/connexion', { replace: true });
        return;
      }
      setErreur(err.message || 'Suppression impossible, réessaie.');
      throw err; // signale l'échec à MesureLigne pour qu'elle réaffiche sa confirmation
    }
  }

  return (
    <main className="min-h-screen bg-paper px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-sm flex-col gap-5">
        <h1 className="text-center font-display text-3xl font-semibold text-teal">Historique</h1>

        <FiltreType valeur={filtre} onChange={setFiltre} />

        <MessageRetour statut={erreur ? 'erreur' : null} texte={erreur} />

        {mesures === null && !erreur && (
          <p className="py-10 text-center font-sans text-sm text-neutral-500">Chargement…</p>
        )}

        {mesures !== null && mesures.length === 0 && filtre === 'tout' && (
          <EtatVide
            titre="Aucune mesure pour l’instant"
            description="Tes tensions et glycémies enregistrées apparaîtront ici, groupées par jour."
            texteBouton="Ajouter ma première mesure"
            lienBouton="/"
          />
        )}

        {mesures !== null && mesures.length === 0 && filtre !== 'tout' && (
          <EtatVide
            titre="Rien à afficher"
            description={`Aucune mesure de ${LABEL_FILTRE[filtre]} enregistrée pour l’instant.`}
          />
        )}

        {groupes.map((groupe) => (
          <GroupeJour key={groupe.cle} groupe={groupe} onEditer={gererEdition} onSupprimer={gererSuppression} />
        ))}
      </div>
    </main>
  );
}
