// Export CSV "brut" : toutes les colonnes de la table mesures, sans
// mise en forme ni traduction — pensé pour un médecin qui réimporte le
// fichier dans son propre outil plutôt que pour être lu tel quel.
const COLONNES = [
  'id',
  'type',
  'valeur1',
  'valeur2',
  'pouls',
  'contexte',
  'note',
  'dateHeure',
  'createdAt',
  'updatedAt',
];

function echapperChampCsv(valeur) {
  if (valeur == null) return '';
  const texte = String(valeur);
  return /[",\r\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

export function construireCsvMesures(mesures) {
  const lignes = [COLONNES.join(',')];
  for (const mesure of mesures) {
    lignes.push(COLONNES.map((colonne) => echapperChampCsv(mesure[colonne])).join(','));
  }
  // \r\n : convention CSV la plus largement acceptée par les tableurs.
  return lignes.join('\r\n');
}

export function construireBlobCsv(mesures) {
  // BOM UTF-8 en tête : évite qu'Excel n'interprète mal les accents
  // (contexte, notes) à l'ouverture du fichier.
  return new Blob(['﻿', construireCsvMesures(mesures)], { type: 'text/csv;charset=utf-8' });
}
