export default function BoutonEnregistrer({ chargement }) {
  return (
    <button
      type="submit"
      disabled={chargement}
      className="w-full rounded-xl bg-corail py-3 font-sans font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {chargement ? 'Enregistrement…' : 'Enregistrer la mesure'}
    </button>
  );
}
