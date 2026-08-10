// Couche CONTRÔLEURS pour les rappels — voir mesureController.js pour le
// raisonnement d'ensemble (validation, puis repository, puis réponse).
import * as rappelRepository from '../repositories/rappelRepository.js';
import { reglagesRappelSchema, abonnementPushSchema, desabonnementPushSchema } from '../validation/rappelSchemas.js';

function formatErreursZod(erreurZod) {
  return erreurZod.issues.map((issue) => ({
    champ: issue.path.join('.'),
    message: issue.message,
  }));
}

export async function obtenirReglages(req, res) {
  const preference = await rappelRepository.trouverPreference(req.userId);
  res.json(preference ?? rappelRepository.valeursParDefaut(req.userId));
}

export async function modifierReglages(req, res) {
  const resultat = reglagesRappelSchema.safeParse(req.body);
  if (!resultat.success) {
    return res.status(400).json({ erreurs: formatErreursZod(resultat.error) });
  }

  const preference = await rappelRepository.enregistrerPreference(req.userId, resultat.data);
  res.json(preference);
}

export async function creerAbonnement(req, res) {
  const resultat = abonnementPushSchema.safeParse(req.body);
  if (!resultat.success) {
    return res.status(400).json({ erreurs: formatErreursZod(resultat.error) });
  }

  await rappelRepository.creerOuMettreAJourAbonnement(req.userId, resultat.data);
  res.status(201).json({ ok: true });
}

export async function supprimerAbonnement(req, res) {
  const resultat = desabonnementPushSchema.safeParse(req.body);
  if (!resultat.success) {
    return res.status(400).json({ erreurs: formatErreursZod(resultat.error) });
  }

  await rappelRepository.supprimerAbonnement(req.userId, resultat.data.endpoint);
  res.status(204).send();
}
