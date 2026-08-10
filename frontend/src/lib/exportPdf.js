// Génération du PDF d'export, entièrement côté client (voir la note de
// choix de librairie dans le rapport transmis avec cette fonctionnalité).
//
// Approche : les graphiques (déjà construits pour l'écran Tendances, en
// SVG pur via Recharts) sont rasterisés en image PNG à la volée — pas de
// dépendance supplémentaire (type html2canvas) pour ça, juste
// XMLSerializer + <canvas>. Tout le reste (titres, légendes, tableau) est
// dessiné en vectoriel directement par jsPDF : plus net à l'impression
// qu'une capture d'écran globale, et les légendes restent lisibles même
// sans couleur (formes dessinées, pas de simples pastilles colorées).
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateCourte, formatHeure, formatValeurs, libelleContexte, tronquer } from './formatage.js';
import { CONTEXTES_PAR_TYPE } from '../validation/mesureValidation.js';

const GRIS_FONCE = [40, 40, 40];
const GRIS_MOYEN = [130, 130, 130];
const GRIS_CLAIR = [225, 221, 212];

const FORMES_GLYCEMIE = {
  a_jeun: 'cercle',
  avant_repas: 'triangle',
  apres_repas: 'losange',
  coucher: 'carre',
};

// Rasterise un élément <svg> déjà présent dans le DOM (celui du
// graphique Recharts affiché à l'écran) en image PNG utilisable par
// jsPDF. Fonctionne parce que Recharts ne produit que des formes SVG
// natives (line, path, circle, polygon...), sans HTML imbriqué via
// foreignObject — sérialisable tel quel.
async function svgVersImage(svgElement, echelle = 3) {
  const rect = svgElement.getBoundingClientRect();
  const clone = svgElement.cloneNode(true);
  clone.setAttribute('width', rect.width);
  clone.setAttribute('height', rect.height);

  const source = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Impossible de préparer le graphique pour le PDF.'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = rect.width * echelle;
    canvas.height = rect.height * echelle;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(echelle, echelle);
    ctx.drawImage(image, 0, 0, rect.width, rect.height);

    return { dataUrl: canvas.toDataURL('image/png'), largeur: rect.width, hauteur: rect.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Dessine, en vectoriel, la même forme que celle utilisée à l'écran pour
// distinguer les contextes de glycémie — pour que la légende du PDF reste
// lisible même imprimée en noir et blanc (pas de simple carré de couleur).
function dessinerFormeGlycemie(doc, forme, x, y, taille) {
  doc.setFillColor(...GRIS_FONCE);
  switch (forme) {
    case 'triangle':
      doc.triangle(x, y - taille, x - taille, y + taille * 0.8, x + taille, y + taille * 0.8, 'F');
      break;
    case 'losange':
      doc.lines([[taille, taille], [-taille, taille], [-taille, -taille]], x, y - taille, [1, 1], 'F', true);
      break;
    case 'carre':
      doc.rect(x - taille * 0.85, y - taille * 0.85, taille * 1.7, taille * 1.7, 'F');
      break;
    case 'cercle':
    default:
      doc.circle(x, y, taille * 0.85, 'F');
      break;
  }
}

export function nomFichierExport(extension, periode) {
  const date = new Intl.DateTimeFormat('fr-CA').format(new Date());
  return `constance-export-${periode}j-${date}.${extension}`;
}

// Construit le document PDF complet : en-tête (patient + période), une
// section par type de mesure présent (résumé + graphique + légende), puis
// le tableau détaillé de toutes les mesures de la période. `svgTension` /
// `svgGlycemie` sont les éléments <svg> réellement affichés à l'écran
// (aperçu de l'écran Export) — null si aucune mesure de ce type.
export async function genererDocumentPdf({ nomPatient, periodeLisible, mesures, resumeTension, resumeGlycemie, svgTension, svgGlycemie }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margeGauche = 15;
  const largeurPage = doc.internal.pageSize.getWidth();
  const hauteurPage = doc.internal.pageSize.getHeight();
  const largeurUtile = largeurPage - margeGauche * 2;
  let y = 18;

  function sautDePageSiNecessaire(hauteurRequise) {
    if (y + hauteurRequise > hauteurPage - 15) {
      doc.addPage();
      y = 18;
    }
  }

  doc.setTextColor(...GRIS_FONCE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Constance — Export des mesures', margeGauche, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Patient : ${nomPatient}`, margeGauche, y);
  y += 5;
  doc.text(`Période : ${periodeLisible}`, margeGauche, y);
  y += 5;
  doc.setTextColor(...GRIS_MOYEN);
  doc.setFontSize(8);
  doc.text(`Généré le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}`, margeGauche, y);
  y += 9;

  if (resumeTension && svgTension) {
    sautDePageSiNecessaire(95);
    doc.setTextColor(...GRIS_FONCE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Tension', margeGauche, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Moyenne ${resumeTension.moyenne.systolique}/${resumeTension.moyenne.diastolique} mmHg` +
        `   ·   Plus haute ${resumeTension.plusHaute.systolique}/${resumeTension.plusHaute.diastolique} mmHg` +
        `   ·   Plus basse ${resumeTension.plusBasse.systolique}/${resumeTension.plusBasse.diastolique} mmHg`,
      margeGauche,
      y,
    );
    y += 6;

    const { dataUrl, largeur, hauteur } = await svgVersImage(svgTension);
    const hauteurImage = (largeurUtile * hauteur) / largeur;
    doc.addImage(dataUrl, 'PNG', margeGauche, y, largeurUtile, hauteurImage);
    y += hauteurImage + 4;

    doc.setFontSize(8);
    doc.setTextColor(...GRIS_MOYEN);
    doc.text('Trait plein foncé = systolique · trait plein clair = diastolique · pointillés = pouls', margeGauche, y);
    y += 9;
  }

  if (resumeGlycemie && svgGlycemie) {
    sautDePageSiNecessaire(95);
    doc.setTextColor(...GRIS_FONCE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Glycémie', margeGauche, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Moyenne ${resumeGlycemie.moyenne} mg/dL   ·   Plus haute ${resumeGlycemie.plusHaute} mg/dL   ·   Plus basse ${resumeGlycemie.plusBasse} mg/dL`,
      margeGauche,
      y,
    );
    y += 6;

    const { dataUrl, largeur, hauteur } = await svgVersImage(svgGlycemie);
    const hauteurImage = (largeurUtile * hauteur) / largeur;
    doc.addImage(dataUrl, 'PNG', margeGauche, y, largeurUtile, hauteurImage);
    y += hauteurImage + 5;

    doc.setFontSize(8);
    let xLegende = margeGauche;
    for (const { valeur, label } of CONTEXTES_PAR_TYPE.glycemie) {
      dessinerFormeGlycemie(doc, FORMES_GLYCEMIE[valeur], xLegende + 1.5, y - 1.2, 1.6);
      doc.setTextColor(...GRIS_MOYEN);
      doc.text(label, xLegende + 4.5, y);
      xLegende += 4.5 + doc.getTextWidth(label) + 6;
    }
    y += 9;
  }

  sautDePageSiNecessaire(20);
  doc.setTextColor(...GRIS_FONCE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Mesures détaillées', margeGauche, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margeGauche, right: margeGauche },
    styles: { fontSize: 8, textColor: GRIS_FONCE, lineColor: GRIS_CLAIR },
    headStyles: { fillColor: GRIS_FONCE, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 246, 241] },
    head: [['Date', 'Heure', 'Type', 'Valeur', 'Contexte', 'Note']],
    body: mesures.map((mesure) => [
      formatDateCourte(mesure.dateHeure),
      formatHeure(mesure.dateHeure),
      mesure.type === 'tension' ? 'Tension' : 'Glycémie',
      formatValeurs(mesure),
      libelleContexte(mesure.contexte),
      mesure.note ? tronquer(mesure.note, 60) : '',
    ]),
  });

  return doc;
}
