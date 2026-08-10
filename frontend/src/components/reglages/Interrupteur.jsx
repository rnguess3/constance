// Interrupteur on/off simple (checkbox stylée en pilule) — pas de
// dépendance externe pour un composant aussi basique.
export default function Interrupteur({ id, actif, onChange, label }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={actif}
      aria-label={label}
      onClick={() => onChange(!actif)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${actif ? 'bg-teal' : 'bg-neutral-300'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          actif ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
