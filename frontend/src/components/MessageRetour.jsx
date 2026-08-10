// Retour visuel après une action (succès / erreur / enregistré
// hors-ligne). Toujours affiché inline — jamais de popup/modale qui
// interromprait l'utilisateur. Partagé entre l'écran de saisie et
// l'historique.
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
