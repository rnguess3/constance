// Retour visuel après l'envoi (succès / erreur / enregistré hors-ligne).
// Toujours affiché inline sous le formulaire — jamais de popup/modale
// qui interromprait la saisie de la mesure suivante.
const STYLES = {
  succes: 'bg-teal/10 text-teal border-teal/30',
  erreur: 'bg-corail/10 text-corail border-corail/30',
  horsligne: 'bg-neutral-100 text-neutral-600 border-neutral-300',
};

export default function MessageRetour({ statut, texte }) {
  if (!statut) return null;

  return (
    <p role="status" className={`rounded-lg border px-4 py-2 text-center font-sans text-sm ${STYLES[statut]}`}>
      {texte}
    </p>
  );
}
