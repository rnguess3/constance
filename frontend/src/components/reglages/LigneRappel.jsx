import Interrupteur from './Interrupteur.jsx';

// Une ligne = un rappel quotidien (matin ou soir) : interrupteur
// d'activation + heure (visible seulement si actif, pour ne pas donner
// l'impression qu'un horaire grisé compte encore).
export default function LigneRappel({ id, titre, actif, heure, onChangeActif, onChangeHeure }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="font-sans text-sm font-medium text-neutral-700">{titre}</span>
        {actif && (
          <input
            type="time"
            id={id}
            value={heure}
            onChange={(e) => onChangeHeure(e.target.value)}
            className="w-fit rounded-lg border border-neutral-300 bg-white px-2 py-1 font-mono text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-teal"
          />
        )}
      </div>
      <Interrupteur id={`${id}-interrupteur`} actif={actif} onChange={onChangeActif} label={titre} />
    </div>
  );
}
