// Sélecteur "Tension" / "Glycémie" à sélection unique, en haut de
// l'écran de saisie. Change le type change aussi les champs affichés et
// la liste de contextes proposée (voir SaisirMesurePage.jsx).
const OPTIONS = [
  { valeur: 'tension', label: 'Tension' },
  { valeur: 'glycemie', label: 'Glycémie' },
];

export default function OngletsType({ valeur, onChange }) {
  return (
    <div className="flex gap-2 rounded-xl bg-neutral-100 p-1" role="tablist">
      {OPTIONS.map((option) => {
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
