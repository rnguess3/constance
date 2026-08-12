// Petites fonctions d'affichage pour l'historique : heure, libellé de
// jour ("Aujourd'hui" / "Hier" / date complète), regroupement par jour,
// et libellés lisibles pour les valeurs/contexte d'une mesure.
import { CONTEXTES_PAR_TYPE } from '../validation/mesureValidation.js';
import { formaterValeurGlycemie, lireUnitePreferee } from './uniteGlycemie.js';

const FORMATEUR_HEURE = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const FORMATEUR_JOUR = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const FORMATEUR_DATE_COURTE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function formatHeure(dateIso) {
  return FORMATEUR_HEURE.format(new Date(dateIso));
}

export function formatDateCourte(dateIso) {
  return FORMATEUR_DATE_COURTE.format(new Date(dateIso));
}

function estMemeJour(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function libelleJour(date) {
  const maintenant = new Date();
  if (estMemeJour(date, maintenant)) return "Aujourd'hui";

  const hier = new Date(maintenant);
  hier.setDate(hier.getDate() - 1);
  if (estMemeJour(date, hier)) return 'Hier';

  const texte = FORMATEUR_JOUR.format(date);
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

// Regroupe une liste de mesures (déjà triée du plus récent au plus
// ancien, comme le renvoie GET /mesures) en groupes par jour calendaire,
// en conservant l'ordre déjà correct.
export function grouperParJour(mesures) {
  const groupes = [];
  const index = new Map();

  for (const mesure of mesures) {
    const date = new Date(mesure.dateHeure);
    const cle = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    let groupe = index.get(cle);
    if (!groupe) {
      groupe = { cle, dateReference: date, mesures: [] };
      index.set(cle, groupe);
      groupes.push(groupe);
    }
    groupe.mesures.push(mesure);
  }

  return groupes;
}

const LIBELLES_CONTEXTE = Object.fromEntries(
  Object.values(CONTEXTES_PAR_TYPE)
    .flat()
    .map((c) => [c.valeur, c.label]),
);

export function libelleContexte(contexte) {
  return LIBELLES_CONTEXTE[contexte] ?? contexte;
}

export function formatValeurs(mesure) {
  if (mesure.type === 'tension') {
    const pouls = mesure.pouls != null ? ` · ${mesure.pouls} bpm` : '';
    return `${mesure.valeur1}/${mesure.valeur2} mmHg${pouls}`;
  }
  return formaterValeurGlycemie(mesure.valeur1, lireUnitePreferee());
}

export function tronquer(texte, longueurMax) {
  if (!texte || texte.length <= longueurMax) return texte;
  return `${texte.slice(0, longueurMax - 1)}…`;
}
