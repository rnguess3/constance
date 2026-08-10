// Couche VALIDATION pour les rappels : préférences (heures/activation) et
// abonnements Web Push (endpoint + clés fournis tel quel par le
// navigateur — voir PushSubscription.toJSON() côté client).
import { z } from 'zod';

const HEURE_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const reglagesRappelSchema = z.object({
  rappelMatinActif: z.boolean(),
  heureMatin: z.string().regex(HEURE_REGEX, 'heureMatin doit être au format HH:mm (24h)'),
  rappelSoirActif: z.boolean(),
  heureSoir: z.string().regex(HEURE_REGEX, 'heureSoir doit être au format HH:mm (24h)'),
  // Nom de fuseau IANA (ex. "Europe/Paris") — validé par tentative de
  // formatage plutôt que par une liste en dur, qui deviendrait vite
  // obsolète ou incomplète.
  fuseauHoraire: z.string().min(1, 'fuseauHoraire est requis').refine((tz) => {
    try {
      new Intl.DateTimeFormat('fr-FR', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'fuseauHoraire doit être un identifiant de fuseau IANA valide'),
});

export const abonnementPushSchema = z.object({
  endpoint: z.string().url('endpoint doit être une URL valide'),
  keys: z.object({
    p256dh: z.string().min(1, 'keys.p256dh est requis'),
    auth: z.string().min(1, 'keys.auth est requis'),
  }),
});

export const desabonnementPushSchema = z.object({
  endpoint: z.string().url('endpoint doit être une URL valide'),
});
