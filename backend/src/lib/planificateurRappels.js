// Planificateur des rappels quotidiens : toutes les 60 secondes, compare
// l'heure courante (convertie dans le fuseau de chaque utilisateur) aux
// heures de rappel configurées, et envoie une notification Web Push aux
// abonnements concernés.
//
// Choix : un simple setInterval() en mémoire dans le process Express,
// plutôt qu'un vrai scheduler externe (cron système, worker séparé, etc.).
// Cohérent avec le reste du backend (un seul process, pas d'infra de
// file d'attente ailleurs dans le projet) et suffisant pour l'usage visé
// (rappels "au réveil"/"au coucher", pas une échéance à la seconde près).
// Limite connue : si le process redémarre pile pendant la minute cible,
// ce rappel du jour peut être manqué (pas de rattrapage a posteriori) —
// acceptable pour un rappel de confort, pas pour une alerte critique.
import webpush from 'web-push';
import prisma from './prisma.js';

const VAPID_SUBJECT = process.env.VAPID_SUBJECT;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let configure = false;

function assurerConfiguration() {
  if (configure) return true;
  if (!VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configure = true;
  return true;
}

// Heure et date "civiles" (celles qu'un utilisateur lirait sur une
// horloge) dans un fuseau IANA donné, sans dépendance externe.
function heureCourante(fuseauHoraire) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: fuseauHoraire,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { hhmm: `${parts.hour}:${parts.minute}`, jour: `${parts.year}-${parts.month}-${parts.day}` };
}

async function envoyerAuxAbonnements(userId, payload) {
  const abonnements = await prisma.abonnementPush.findMany({ where: { userId } });

  await Promise.all(
    abonnements.map(async (abonnement) => {
      try {
        await webpush.sendNotification(
          { endpoint: abonnement.endpoint, keys: { p256dh: abonnement.cleP256dh, auth: abonnement.cleAuth } },
          JSON.stringify(payload),
        );
      } catch (err) {
        // 404/410 : le navigateur a invalidé cet abonnement (désinstallation,
        // nettoyage du profil...) — on le retire plutôt que de continuer à
        // échouer dessus indéfiniment.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.abonnementPush.delete({ where: { id: abonnement.id } }).catch(() => {});
        } else {
          console.error(`Échec d'envoi de la notification push (userId=${userId}) :`, err.message);
        }
      }
    }),
  );
}

async function verifierEtEnvoyer() {
  const preferences = await prisma.preferenceRappel.findMany({
    where: { OR: [{ rappelMatinActif: true }, { rappelSoirActif: true }] },
  });

  for (const preference of preferences) {
    const { hhmm, jour } = heureCourante(preference.fuseauHoraire);

    if (preference.rappelMatinActif && preference.heureMatin === hhmm && preference.derniereDateEnvoiMatin !== jour) {
      await envoyerAuxAbonnements(preference.userId, {
        titre: 'Constance',
        corps: 'C’est l’heure de ta prise du matin.',
      });
      await prisma.preferenceRappel.update({
        where: { id: preference.id },
        data: { derniereDateEnvoiMatin: jour },
      });
    }

    if (preference.rappelSoirActif && preference.heureSoir === hhmm && preference.derniereDateEnvoiSoir !== jour) {
      await envoyerAuxAbonnements(preference.userId, {
        titre: 'Constance',
        corps: 'C’est l’heure de ta prise du soir.',
      });
      await prisma.preferenceRappel.update({
        where: { id: preference.id },
        data: { derniereDateEnvoiSoir: jour },
      });
    }
  }
}

let intervalle = null;

export function demarrerPlanificateurRappels() {
  if (intervalle) return;

  if (!assurerConfiguration()) {
    console.warn(
      'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT absents : planificateur de rappels désactivé (voir backend/.env.example).',
    );
    return;
  }

  const tick = () => verifierEtEnvoyer().catch((err) => console.error('Erreur du planificateur de rappels :', err));
  tick();
  intervalle = setInterval(tick, 60_000);
}
