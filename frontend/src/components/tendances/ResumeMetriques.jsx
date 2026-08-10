// Rangée de 3 tuiles résumant une période : moyenne / plus haute / plus
// basse. Générique — les deux graphiques (tension, glycémie) lui passent
// juste des libellés déjà formatés, aucune logique de calcul ici.
export default function ResumeMetriques({ items, couleur }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-white px-2 py-3 text-center">
          <p className="font-sans text-[11px] uppercase tracking-wide text-neutral-400">{item.label}</p>
          <p className={`mt-1 font-mono text-base font-medium ${couleur}`}>{item.valeur}</p>
          {item.unite && <p className="font-sans text-[11px] text-neutral-400">{item.unite}</p>}
        </div>
      ))}
    </div>
  );
}
