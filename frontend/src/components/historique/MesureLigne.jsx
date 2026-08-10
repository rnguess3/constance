// Une ligne de l'historique : taper la partie principale ouvre l'écran
// de saisie pré-rempli (édition) ; l'icône à droite déclenche une
// suppression, avec une confirmation affichée EN LIGNE (pas de popup)
// avant d'agir réellement.
import { useState } from 'react';
import { formatHeure, formatValeurs, libelleContexte, tronquer } from '../../lib/formatage.js';

const STYLE_BADGE = {
  tension: 'bg-teal/10 text-teal',
  glycemie: 'bg-corail/10 text-corail',
};

const LABEL_BADGE = {
  tension: 'Tension',
  glycemie: 'Glycémie',
};

export default function MesureLigne({ mesure, onEditer, onSupprimer }) {
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  async function confirmerSuppression() {
    setSuppressionEnCours(true);
    try {
      await onSupprimer(mesure.id);
      // Si onSupprimer réussit, la ligne est retirée par le parent — pas
      // besoin de remettre suppressionEnCours à false, le composant va
      // être démonté.
    } catch {
      setSuppressionEnCours(false);
      setConfirmationOuverte(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-neutral-200 py-3 last:border-0">
      <button type="button" onClick={() => onEditer(mesure)} className="flex flex-1 items-center gap-3 text-left">
        <span className="w-12 shrink-0 font-mono text-sm text-neutral-500">{formatHeure(mesure.dateHeure)}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 font-sans text-xs font-medium ${STYLE_BADGE[mesure.type]}`}>
          {LABEL_BADGE[mesure.type]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-lg text-neutral-800">{formatValeurs(mesure)}</span>
          <span className="block truncate font-sans text-xs text-neutral-500">
            {libelleContexte(mesure.contexte)}
            {mesure.note ? ` · ${tronquer(mesure.note, 30)}` : ''}
          </span>
        </span>
      </button>

      {confirmationOuverte ? (
        <div className="flex shrink-0 items-center gap-2 font-sans text-xs">
          <button
            type="button"
            onClick={confirmerSuppression}
            disabled={suppressionEnCours}
            className="rounded-md bg-corail px-2 py-1 text-white disabled:opacity-50"
          >
            {suppressionEnCours ? '…' : 'Confirmer'}
          </button>
          <button type="button" onClick={() => setConfirmationOuverte(false)} className="text-neutral-500">
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Supprimer cette mesure"
          onClick={() => setConfirmationOuverte(true)}
          className="shrink-0 rounded-full p-2 text-neutral-400 hover:text-corail"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
          </svg>
        </button>
      )}
    </div>
  );
}
