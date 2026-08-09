// Vide la file d'attente hors-ligne vers le serveur, dès qu'une
// connexion (et un token valide) est disponible. Appelée par
// useSynchronisation.js au retour en ligne et au chargement de l'app.
import { appelApi, SessionExpireeError } from './api.js';
import { listerMesuresEnAttente, supprimerMesureEnAttente } from './mesuresHorsLigne.js';

// `getToken` est la fonction fournie par useAuth() de Clerk : on
// redemande un token à jour pour chaque tentative de synchronisation
// (voir api.js pour pourquoi on ne le garde jamais en mémoire nous-mêmes).
export async function synchroniserMesuresEnAttente(getToken) {
  const enAttente = await listerMesuresEnAttente();
  let synchronisees = 0;

  for (const entree of enAttente) {
    try {
      const token = await getToken();
      await appelApi('/mesures', {
        method: 'POST',
        token,
        body: JSON.stringify(entree.payload),
      });
      await supprimerMesureEnAttente(entree.idLocal);
      synchronisees += 1;
    } catch (err) {
      if (err instanceof SessionExpireeError) {
        // Plus la peine de continuer si la session n'est plus valide :
        // on arrête, la page de connexion prendra le relais.
        break;
      }
      if (err instanceof TypeError) {
        // Toujours hors-ligne (ou reconnexion trop brève) : on arrête là
        // pour cette tentative, on réessaiera au prochain événement
        // "online" ou chargement de page. Les entrées suivantes de la
        // file restent intactes.
        break;
      }
      // Erreur "métier" inattendue (ex: 400 malgré la validation
      // côté client) : on ne perd pas la mesure (on ne la supprime pas
      // de la file), mais on ne bloque pas non plus la synchronisation
      // des autres entrées. Limite connue : cette entrée restera
      // indéfiniment "en attente" tant qu'elle n'est pas corrigée ou
      // supprimée manuellement — l'écran de gestion de ces cas n'est pas
      // encore construit.
      console.error('Échec de synchronisation d’une mesure en attente :', err);
    }
  }

  return { synchronisees, restantes: enAttente.length - synchronisees };
}
