// Conversion et préférence d'unité pour les mesures de GLYCÉMIE.
//
// Le backend stocke et valide toujours la glycémie en mg/dL, en entier
// (voir backend/src/validation/mesureSchemas.js et
// backend/prisma/schema.prisma : valeur1 Int). Il n'existe aucune notion
// d'unité côté API/DB — c'est un choix délibéré pour ne pas avoir à faire
// de migration ni à convertir dans les calculs de tendances (moyenne,
// min, max), qui restent tous en mg/dL en interne.
//
// Ce module gère uniquement la couche présentation : l'utilisateur choisit
// une unité préférée (mémorisée sur cet appareil), la saisie est convertie
// vers mg/dL avant l'envoi à l'API, et les valeurs mg/dL reçues sont
// reconverties pour l'affichage (historique, tendances, export PDF).
export const UNITES_GLYCEMIE = ['mg/dL', 'mmol/L', 'g/L'];

const CLE_PREFERENCE = 'constance:unite-glycemie';

// 1 mmol/L = 18.0182 mg/dL (facteur de conversion standard du glucose).
const FACTEUR_MMOL_VERS_MGDL = 18.0182;
// 1 g/L = 1000 mg/L = 100 mg/dL (dL = 0.1 L).
const FACTEUR_GL_VERS_MGDL = 100;

// Nombre de décimales pertinent par unité : mg/dL reste un entier (c'est
// ainsi que les lecteurs de glycémie l'affichent), mmol/L et g/L
// s'expriment naturellement avec des décimales.
export const DECIMALES_PAR_UNITE = { 'mg/dL': 0, 'mmol/L': 1, 'g/L': 2 };

export function convertirVersMgDl(valeur, unite) {
  if (unite === 'mmol/L') return valeur * FACTEUR_MMOL_VERS_MGDL;
  if (unite === 'g/L') return valeur * FACTEUR_GL_VERS_MGDL;
  return valeur;
}

export function convertirDepuisMgDl(valeurMgDl, unite) {
  if (unite === 'mmol/L') return valeurMgDl / FACTEUR_MMOL_VERS_MGDL;
  if (unite === 'g/L') return valeurMgDl / FACTEUR_GL_VERS_MGDL;
  return valeurMgDl;
}

// Arrondit à la précision d'affichage de l'unité (évite les artefacts
// flottants type 5.500000000001).
export function arrondirPourUnite(valeur, unite) {
  const facteur = 10 ** DECIMALES_PAR_UNITE[unite];
  return Math.round(valeur * facteur) / facteur;
}

// Convertit une valeur mg/dL vers l'unité choisie, arrondie à la
// précision d'affichage, sous forme de chaîne (ex: "5.5", "100", "0.90").
export function formaterNombreDepuisMgDl(valeurMgDl, unite) {
  return arrondirPourUnite(convertirDepuisMgDl(valeurMgDl, unite), unite).toFixed(DECIMALES_PAR_UNITE[unite]);
}

export function formaterValeurGlycemie(valeurMgDl, unite) {
  return `${formaterNombreDepuisMgDl(valeurMgDl, unite)} ${unite}`;
}

export function lireUnitePreferee() {
  if (typeof window === 'undefined') return 'mg/dL';
  const stockee = window.localStorage.getItem(CLE_PREFERENCE);
  return UNITES_GLYCEMIE.includes(stockee) ? stockee : 'mg/dL';
}

export function ecrireUnitePreferee(unite) {
  if (typeof window === 'undefined' || !UNITES_GLYCEMIE.includes(unite)) return;
  window.localStorage.setItem(CLE_PREFERENCE, unite);
}
