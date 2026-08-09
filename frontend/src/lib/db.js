// Base IndexedDB locale de Constance : sert uniquement de file d'attente
// pour les mesures saisies hors connexion (voir mesuresHorsLigne.js et
// le choix IndexedDB vs localStorage expliqué dans SaisirMesurePage.jsx).
import { openDB } from 'idb';

const NOM_BASE = 'constance';
const VERSION_BASE = 1;
export const MAGASIN_MESURES_EN_ATTENTE = 'mesures_en_attente';

let promesseBase;

// Ouvre (et crée si besoin) la base. `openDB` ne se connecte qu'une
// fois : les appels suivants réutilisent la même connexion.
export function obtenirBase() {
  if (!promesseBase) {
    promesseBase = openDB(NOM_BASE, VERSION_BASE, {
      upgrade(base) {
        // keyPath 'idLocal' : identifiant généré côté client
        // (crypto.randomUUID), différent de l'id serveur qui n'existe
        // pas encore tant que la mesure n'est pas synchronisée.
        base.createObjectStore(MAGASIN_MESURES_EN_ATTENTE, { keyPath: 'idLocal' });
      },
    });
  }
  return promesseBase;
}
