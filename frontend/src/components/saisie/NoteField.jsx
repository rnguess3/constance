export default function NoteField({ value, onChange, erreur }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="note" className="font-sans text-sm text-neutral-500">
        Note (optionnel)
      </label>
      <textarea
        id="note"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={2000}
        rows={2}
        placeholder="Ex : après le café, un peu stressé…"
        className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 font-sans text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-teal"
      />
      {erreur && <span className="font-sans text-xs text-corail">{erreur}</span>}
    </div>
  );
}
