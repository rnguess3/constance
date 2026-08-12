// Champ numérique "gros" pour la saisie rapide d'une valeur (systolique,
// diastolique, pouls, glycémie...).
//
// type="text" + inputMode="numeric"/"decimal" (plutôt que type="number") :
// ouvre bien le clavier numérique sur mobile, tout en évitant les
// bizarreries du type number natif (flèches +/-, "e" accepté, zéros de
// tête supprimés automatiquement...). On filtre nous-mêmes les
// caractères non numériques dans onChange.
//
// `decimales` : nombre de chiffres après la virgule autorisés (0 par
// défaut = comportement historique, entier sur 3 chiffres). Utilisé pour
// la glycémie en mmol/L ou g/L, qui se saisissent avec des décimales
// (voir lib/uniteGlycemie.js).
function filtrerSaisieNumerique(brut, decimales) {
  if (decimales <= 0) {
    return brut.replace(/[^0-9]/g, '').slice(0, 3);
  }
  const nettoye = brut.replace(',', '.').replace(/[^0-9.]/g, '');
  const indexPoint = nettoye.indexOf('.');
  if (indexPoint === -1) return nettoye.slice(0, 2);
  const partieEntiere = nettoye.slice(0, indexPoint).slice(0, 2);
  const partieDecimale = nettoye.slice(indexPoint + 1).replace(/\./g, '').slice(0, decimales);
  return `${partieEntiere}.${partieDecimale}`;
}

export default function NumericField({ label, unite, value, onChange, erreur, autoFocus = false, id, decimales = 0 }) {
  function gererChangement(e) {
    onChange(filtrerSaisieNumerique(e.target.value, decimales));
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <label htmlFor={id} className="font-sans text-sm text-neutral-500">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={decimales > 0 ? 'decimal' : 'numeric'}
        pattern={decimales > 0 ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
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
