// Couche CONTRÔLEURS : fait le lien entre HTTP (req/res) et le reste de
// l'application. Un contrôleur ne contient pas de logique métier ni
// d'accès direct à Prisma : il valide l'entrée (couche validation),
// appelle le repository (couche accès données), puis formate la réponse.
import * as mesureRepository from '../repositories/mesureRepository.js';
import {
  creerMesureSchema,
  modifierMesureSchema,
  listerMesuresQuerySchema,
  mesureBusinessRules,
} from '../validation/mesureSchemas.js';

function formatErreursZod(erreurZod) {
  return erreurZod.issues.map((issue) => ({
    champ: issue.path.join('.'),
    message: issue.message,
  }));
}

export async function creerMesure(req, res) {
  const resultat = creerMesureSchema.safeParse(req.body);
  if (!resultat.success) {
    return res.status(400).json({ erreurs: formatErreursZod(resultat.error) });
  }

  const mesure = await mesureRepository.creer({
    ...resultat.data,
    userId: req.userId,
  });
  res.status(201).json(mesure);
}

export async function listerMesures(req, res) {
  const resultat = listerMesuresQuerySchema.safeParse(req.query);
  if (!resultat.success) {
    return res.status(400).json({ erreurs: formatErreursZod(resultat.error) });
  }

  const mesures = await mesureRepository.lister({
    userId: req.userId,
    ...resultat.data,
  });
  res.json(mesures);
}

export async function modifierMesure(req, res) {
  const { id } = req.params;

  const existante = await mesureRepository.trouverParId(id, req.userId);
  if (!existante) {
    return res.status(404).json({ erreur: 'Mesure introuvable' });
  }

  const resultatPartiel = modifierMesureSchema.safeParse(req.body);
  if (!resultatPartiel.success) {
    return res.status(400).json({ erreurs: formatErreursZod(resultatPartiel.error) });
  }

  // On fusionne la mesure existante avec les champs modifiés, puis on
  // revalide l'état COMPLET avec les mêmes règles métier qu'à la
  // création. Sans cette étape, un PATCH pourrait par exemple faire
  // passer "type" de "tension" à "glycemie" sans toucher "contexte", et
  // laisser en base un contexte de tension incohérent avec le nouveau
  // type — ou une "valeur2" (diastolique) orpheline sur une glycémie.
  const etatComplet = { ...existante, ...resultatPartiel.data };
  const issues = [];
  mesureBusinessRules(etatComplet, { addIssue: (issue) => issues.push(issue) });
  if (issues.length > 0) {
    return res.status(400).json({
      erreurs: issues.map((issue) => ({ champ: issue.path.join('.'), message: issue.message })),
    });
  }

  const mesure = await mesureRepository.modifier(id, resultatPartiel.data);
  res.json(mesure);
}

export async function supprimerMesure(req, res) {
  const { id } = req.params;

  const existante = await mesureRepository.trouverParId(id, req.userId);
  if (!existante) {
    return res.status(404).json({ erreur: 'Mesure introuvable' });
  }

  await mesureRepository.supprimer(id);
  res.status(204).send();
}
