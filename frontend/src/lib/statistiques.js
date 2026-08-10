// Calculs statistiques pour l'écran Tendances : bornes de période et
// résumés (moyenne / plus haute / plus basse) par type de mesure.
// Pure logique de données — aucun rendu ici.

export const PERIODES = [
  { valeur: '7', label: '7 jours', jours: 7 },
  { valeur: '30', label: '30 jours', jours: 30 },
];

export function calculerBornesPeriode(periode) {
  const jours = PERIODES.find((p) => p.valeur === periode)?.jours ?? 7;
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - jours);
  return { from, to };
}

const FORMATEUR_DATE_LONGUE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatPeriodeLisible(from, to) {
  return `${FORMATEUR_DATE_LONGUE.format(from)} – ${FORMATEUR_DATE_LONGUE.format(to)}`;
}

// Prépare les mesures d'un type donné pour un graphique : tri
// chronologique croissant (l'API renvoie le plus récent en premier) et
// ajout d'un timestamp numérique (axe X exploitable par Recharts).
export function preparerSeriesChronologiques(mesures) {
  return [...mesures]
    .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure))
    .map((mesure) => ({ ...mesure, timestamp: new Date(mesure.dateHeure).getTime() }));
}

function moyenneArrondie(valeurs) {
  const somme = valeurs.reduce((acc, v) => acc + v, 0);
  return Math.round(somme / valeurs.length);
}

// Résumé tension : la moyenne/plus haute/plus basse sont exprimées comme
// des paires systolique/diastolique complètes (plus lisible qu'un chiffre
// isolé), la mesure la plus haute/basse étant choisie sur la systolique.
export function calculerResumeTension(mesures) {
  if (mesures.length === 0) return null;

  const parSystolique = [...mesures].sort((a, b) => a.valeur1 - b.valeur1);
  const plusBasse = parSystolique[0];
  const plusHaute = parSystolique[parSystolique.length - 1];

  return {
    moyenne: {
      systolique: moyenneArrondie(mesures.map((m) => m.valeur1)),
      diastolique: moyenneArrondie(mesures.map((m) => m.valeur2)),
    },
    plusHaute: { systolique: plusHaute.valeur1, diastolique: plusHaute.valeur2 },
    plusBasse: { systolique: plusBasse.valeur1, diastolique: plusBasse.valeur2 },
  };
}

export function calculerResumeGlycemie(mesures) {
  if (mesures.length === 0) return null;

  const valeurs = mesures.map((m) => m.valeur1);
  return {
    moyenne: moyenneArrondie(valeurs),
    plusHaute: Math.max(...valeurs),
    plusBasse: Math.min(...valeurs),
  };
}
