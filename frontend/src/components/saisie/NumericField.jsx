// Champ numérique "gros" pour la saisie rapide d'une valeur (systolique,
// diastolique, pouls, glycémie...).
//
// type="text" + inputMode="numeric" (plutôt que type="number") : ouvre
// bien le clavier numérique sur mobile, tout en évitant les bizarreries
// du type number natif (flèches +/-, "e" accepté, zéros de tête
// supprimés automatiquement...). On filtre nous-mêmes les caractères non
// numériques dans onChange.
export default function NumericField({ label, unite, value, onChange, erreur, autoFocus = false, id }) {
  function gererChangement(e) {
    const brut = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
    onChange(brut);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <label htmlFor={id} className="font-sans text-sm text-neutral-500">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoFocus={autoFocus}
        value={value}
        onChange={gererChangement}
        placeholder="—"
        className={`w-28 rounded-xl border bg-white py-3 text-center font-mono text-5xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-teal ${
          erreur ? 'border-corail' : 'border-neutral-300'
        }`}
      />
      {unite && <span className="font-sans text-xs text-neutral-400">{unite}</span>}
      {erreur && <span className="font-sans text-xs text-corail">{erreur}</span>}
    </div>
  );
}
