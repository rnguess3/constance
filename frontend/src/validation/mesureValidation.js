// Miroir, côté frontend, des règles définies dans
// backend/src/validation/mesureSchemas.js.
//
// Pourquoi une copie plutôt qu'un package partagé ? Pour un projet de
// cette taille, un monorepo avec du code partagé ajouterait de la
// complexité de tooling (build, résolution de modules entre
// frontend/backend) pour un bénéfice faible vu la taille des règles.
// Cette copie sert UNIQUEMENT à donner un retour instantané à
// l'utilisateur pendant la saisie (pas d'aller-retour réseau pour
// signaler une erreur) : le backend reste la seule source de vérité qui
// fait autorité, et revalide tout de son côté (voir le commentaire en
// tête de mesureSchemas.js pour le détail de ce raisonnement). Si les
// deux venaient à diverger, c'est toujours le refus du serveur qui
// gagne — au pire l'utilisateur a un message d'erreur en retour au lieu
// d'un message immédiat, jamais une donnée invalide enregistrée.
export const TYPES_MESURE = ['tension', 'glycemie'];

export const CONTEXTES_PAR_TYPE = {
  tension: [
    { valeur: 'repos', label: 'Repos' },
    { valeur: 'apres_effort', label: 'Après effort' },
    { valeur: 'stress', label: 'Stress' },
  ],
  glycemie: [
    { valeur: 'a_jeun', label: 'À jeun' },
    { valeur: 'avant_repas', label: 'Avant repas' },
    { valeur: 'apres_repas', label: 'Après repas' },
    { valeur: 'coucher', label: 'Coucher' },
  ],
};

const BORNES = {
  tension: { valeur1: [40, 260], valeur2: [20, 200], pouls: [20, 250] },
  glycemie: { valeur1: [20, 600] },
};

const CINQ_MINUTES_MS = 5 * 60_000;

function estDansLesBornes(valeur, [min, max]) {
  return valeur >= min && valeur <= max;
}

// Valide une mesure et renvoie un objet d'erreurs par champ (vide si
// tout est valide). `donnees` attend : type, valeur1, valeur2, pouls,
// contexte, note, dateHeure (Date).
export function validerMesure(donnees) {
  const erreurs = {};
  const { type, valeur1, valeur2, pouls, contexte, note, dateHeure } = donnees;

  const contextesValides = CONTEXTES_PAR_TYPE[type].map((c) => c.valeur);
  if (!contextesValides.includes(contexte)) {
    erreurs.contexte = 'Choisis un contexte.';
  }

  if (type === 'tension') {
    if (valeur1 == null || !estDansLesBornes(valeur1, BORNES.tension.valeur1)) {
      erreurs.valeur1 = `Doit être compris entre ${BORNES.tension.valeur1[0]} et ${BORNES.tension.valeur1[1]}.`;
    }
    if (valeur2 == null) {
      erreurs.valeur2 = 'La diastolique est requise.';
    } else if (!estDansLesBornes(valeur2, BORNES.tension.valeur2)) {
      erreurs.valeur2 = `Doit être compris entre ${BORNES.tension.valeur2[0]} et ${BORNES.tension.valeur2[1]}.`;
    } else if (valeur1 != null && valeur1 <= valeur2) {
      erreurs.valeur1 = 'La systolique doit être supérieure à la diastolique.';
    }
    if (pouls != null && !estDansLesBornes(pouls, BORNES.tension.pouls)) {
      erreurs.pouls = `Doit être compris entre ${BORNES.tension.pouls[0]} et ${BORNES.tension.pouls[1]}.`;
    }
  }

  if (type === 'glycemie') {
    if (valeur1 == null || !estDansLesBornes(valeur1, BORNES.glycemie.valeur1)) {
      erreurs.valeur1 = `Doit être compris entre ${BORNES.glycemie.valeur1[0]} et ${BORNES.glycemie.valeur1[1]} mg/dL.`;
    }
  }

  if (note && note.length > 2000) {
    erreurs.note = 'Note trop longue (2000 caractères maximum).';
  }

  if (!dateHeure || Number.isNaN(dateHeure.getTime())) {
    erreurs.dateHeure = 'Date invalide.';
  } else if (dateHeure.getTime() > Date.now() + CINQ_MINUTES_MS) {
    erreurs.dateHeure = 'Ne peut pas être dans le futur.';
  }

  return erreurs;
}

export function estValide(erreurs) {
  return Object.keys(erreurs).length === 0;
}
