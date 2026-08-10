// Sélecteur à choix unique sous forme d'onglets segmentés. Générique :
// OngletsType.jsx (Tension/Glycémie, écran de saisie) et FiltreType.jsx
// (Tout/Tension/Glycémie, écran d'historique) ne font que lui fournir
// des options différentes.
export default function SelecteurSegments({ options, valeur, onChange }) {
  return (
    <div className="flex gap-2 rounded-xl bg-neutral-100 p-1" role="tablist">
      {options.map((option) => {
        const selectionne = valeur === option.valeur;
        return (
          <button
            key={option.valeur}
            type="button"
            role="tab"
            aria-selected={selectionne}
            onClick={() => onChange(option.valeur)}
            className={`flex-1 rounded-lg py-2 font-sans text-sm font-medium transition-colors ${
              selectionne ? 'bg-white text-teal shadow-sm' : 'text-neutral-500'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
