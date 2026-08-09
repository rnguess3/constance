// Opérations sur la file d'attente IndexedDB des mesures saisies hors
// connexion (ou dont l'envoi a échoué faute de réseau). Ce fichier ne
// connaît pas l'API HTTP : c'est synchronisation.js qui s'en sert pour
// vider la file une fois la connexion revenue.
import { obtenirBase, MAGASIN_MESURES_EN_ATTENTE } from './db.js';

// `payload` est exactement le corps JSON qu'on aurait envoyé à
// POST /mesures (type, valeur1, valeur2, pouls, contexte, note,
// dateHeure en chaîne ISO).
export async function ajouterMesureEnAttente(payload) {
  const base = await obtenirBase();
  const idLocal = crypto.randomUUID();
  await base.add(MAGASIN_MESURES_EN_ATTENTE, { idLocal, payload, creeLe: new Date().toISOString() });
  return idLocal;
}

export async function listerMesuresEnAttente() {
  const base = await obtenirBase();
  return base.getAll(MAGASIN_MESURES_EN_ATTENTE);
}

export async function supprimerMesureEnAttente(idLocal) {
  const base = await obtenirBase();
  await base.delete(MAGASIN_MESURES_EN_ATTENTE, idLocal);
}

export async function compterMesuresEnAttente() {
  const base = await obtenirBase();
  return base.count(MAGASIN_MESURES_EN_ATTENTE);
}
