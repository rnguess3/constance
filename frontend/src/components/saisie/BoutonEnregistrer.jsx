export default function BoutonEnregistrer({ chargement, texte = 'Enregistrer la mesure', texteChargement = 'Enregistrement…' }) {
  return (
    <button
      type="submit"
      disabled={chargement}
      className="w-full rounded-xl bg-corail py-3 font-sans font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {chargement ? texteChargement : texte}
    </button>
  );
}
