// Sélection à choix unique sous forme de "chips" (plutôt qu'un menu
// déroulant, moins rapide à utiliser au doigt). `options` est la liste
// filtrée pour le type de mesure courant (voir CONTEXTES_PAR_TYPE dans
// validation/mesureValidation.js).
export default function ContextChips({ options, value, onChange, erreur }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-sans text-sm text-neutral-500">Contexte</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selectionne = value === option.valeur;
          return (
            <button
              key={option.valeur}
              type="button"
              aria-pressed={selectionne}
              onClick={() => onChange(option.valeur)}
              className={`rounded-full px-4 py-1.5 font-sans text-sm transition-colors ${
                selectionne
                  ? 'bg-teal text-white'
                  : 'border border-neutral-300 bg-white text-neutral-600'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {erreur && <span className="font-sans text-xs text-corail">{erreur}</span>}
    </div>
  );
}
