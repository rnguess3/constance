// Date/heure de la mesure : pré-remplie à "maintenant" à l'ouverture de
// l'écran (voir SaisirMesurePage.jsx), mais modifiable manuellement —
// utile pour rattraper une mesure prise un peu plus tôt.
//
// L'input HTML datetime-local travaille en heure LOCALE, sans fuseau,
// sous la forme "AAAA-MM-JJTHH:mm". Il faut donc convertir nous-mêmes
// entre ce format et un objet Date JS.
function deuxChiffres(n) {
  return String(n).padStart(2, '0');
}

export function versDatetimeLocal(date) {
  return `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}T${deuxChiffres(
    date.getHours(),
  )}:${deuxChiffres(date.getMinutes())}`;
}

export function depuisDatetimeLocal(texte) {
  return new Date(texte);
}

export default function DateHeureField({ value, onChange, erreur }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="dateHeure" className="font-sans text-sm text-neutral-500">
        Date et heure
      </label>
      <input
        id="dateHeure"
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 font-sans text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-teal"
      />
      {erreur && <span className="font-sans text-xs text-corail">{erreur}</span>}
    </div>
  );
}
