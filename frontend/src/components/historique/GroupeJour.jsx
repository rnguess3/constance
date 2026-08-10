import { libelleJour } from '../../lib/formatage.js';
import MesureLigne from './MesureLigne.jsx';

export default function GroupeJour({ groupe, onEditer, onSupprimer }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="px-1 font-sans text-sm font-medium text-neutral-500">{libelleJour(groupe.dateReference)}</h2>
      <div className="rounded-xl bg-white px-3 shadow-sm">
        {groupe.mesures.map((mesure) => (
          <MesureLigne key={mesure.id} mesure={mesure} onEditer={onEditer} onSupprimer={onSupprimer} />
        ))}
      </div>
    </section>
  );
}
