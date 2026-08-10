import { Link } from 'react-router-dom';

export default function EtatVide({ titre, description, texteBouton, lienBouton }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-10 text-center shadow-sm">
      <p className="font-display text-lg text-neutral-700">{titre}</p>
      <p className="font-sans text-sm text-neutral-500">{description}</p>
      {lienBouton && (
        <Link
          to={lienBouton}
          className="mt-2 rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white hover:bg-teal/90"
        >
          {texteBouton}
        </Link>
      )}
    </div>
  );
}
