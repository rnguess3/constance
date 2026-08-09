// Couche VALIDATION : définit ce qu'est une mesure "valide" avant qu'elle
// n'atteigne la base de données.
//
// Pourquoi valider aussi côté serveur alors que le frontend validera déjà
// le formulaire ?
//   1. Le frontend n'est qu'une façade : n'importe qui peut appeler l'API
//      directement (curl, Postman, un autre client, un attaquant) en
//      contournant totalement le formulaire React. Si seule la validation
//      frontend existait, ces appels directs pourraient écrire n'importe
//      quoi en base (types incohérents, contexte invalide, valeurs
//      absurdes) : c'est une app de suivi médical, l'intégrité des
//      données est critique.
//   2. La validation frontend sert à l'UX (retour immédiat à l'utilisateur
//      sans aller-retour réseau) ; la validation serveur sert de garde-fou
//      final et fait autorité — c'est la seule qu'on ne peut pas
//      contourner.
//   3. Le frontend et le backend peuvent diverger dans le temps (bug,
//      oubli de mise à jour d'un des deux) : dupliquer la règle des deux
//      côtés, avec le serveur comme source de vérité, évite qu'un
//      décalage ne devienne une faille.
import { z } from 'zod';

export const TYPES_MESURE = ['tension', 'glycemie'];

// Valeurs de "contexte" autorisées, selon le type de mesure. Cette
// dépendance entre deux champs ne peut pas être exprimée par un simple
// enum PostgreSQL/Prisma (colonne "contexte" seule) : elle est donc
// vérifiée ici, en code.
export const CONTEXTES_PAR_TYPE = {
  tension: ['repos', 'apres_effort', 'stress'],
  glycemie: ['a_jeun', 'avant_repas', 'apres_repas', 'coucher'],
};

// Bornes "plausibles" (pas des seuils médicaux d'alerte type
// hyper/hypotension) : elles servent uniquement à repérer une erreur de
// saisie ou une valeur aberrante avant l'enregistrement.
const BORNES = {
  tension: { valeur1: [40, 260], valeur2: [20, 200], pouls: [20, 250] },
  // Glycémie exprimée en mg/dL.
  glycemie: { valeur1: [20, 600] },
};

const CINQ_MINUTES_MS = 5 * 60_000;

function estDansLesBornes(valeur, [min, max]) {
  return valeur >= min && valeur <= max;
}

// Schéma "de forme" : types et formats de base, indépendant des règles
// métier (qui, elles, dépendent de la combinaison des champs entre eux).
export const mesureFieldsSchema = z.object({
  type: z.enum(TYPES_MESURE, {
    errorMap: () => ({ message: 'type doit être "tension" ou "glycemie"' }),
  }),
  valeur1: z.number().int('valeur1 doit être un nombre entier'),
  valeur2: z.number().int('valeur2 doit être un nombre entier').nullish(),
  pouls: z.number().int('pouls doit être un nombre entier').nullish(),
  contexte: z.string().min(1, 'contexte est requis'),
  note: z.string().max(2000, 'note trop longue (2000 caractères maximum)').nullish(),
  dateHeure: z.coerce.date({
    errorMap: () => ({ message: 'dateHeure doit être une date valide (ISO 8601)' }),
  }),
});

// Règles métier, appliquées sur l'état COMPLET d'une mesure (tous les
// champs présents). Exportée séparément du schéma de création car elle
// est réutilisée telle quelle par le contrôleur lors d'un PATCH, sur
// l'état obtenu après fusion de la mesure existante avec les champs
// modifiés (voir mesureController.js pour le pourquoi).
export function mesureBusinessRules(data, ctx) {
  const contextesValides = CONTEXTES_PAR_TYPE[data.type];
  if (!contextesValides.includes(data.contexte)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contexte'],
      message: `contexte invalide pour le type "${data.type}". Valeurs attendues : ${contextesValides.join(', ')}`,
    });
  }

  if (data.type === 'tension') {
    if (!estDansLesBornes(data.valeur1, BORNES.tension.valeur1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valeur1'],
        message: `valeur1 (systolique) doit être compris entre ${BORNES.tension.valeur1[0]} et ${BORNES.tension.valeur1[1]}`,
      });
    }
    if (data.valeur2 == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valeur2'],
        message: 'valeur2 (diastolique) est requis pour une mesure de tension',
      });
    } else if (!estDansLesBornes(data.valeur2, BORNES.tension.valeur2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valeur2'],
        message: `valeur2 (diastolique) doit être compris entre ${BORNES.tension.valeur2[0]} et ${BORNES.tension.valeur2[1]}`,
      });
    } else if (data.valeur1 <= data.valeur2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valeur1'],
        message: 'la systolique (valeur1) doit être supérieure à la diastolique (valeur2)',
      });
    }
    if (data.pouls != null && !estDansLesBornes(data.pouls, BORNES.tension.pouls)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pouls'],
        message: `pouls doit être compris entre ${BORNES.tension.pouls[0]} et ${BORNES.tension.pouls[1]}`,
      });
    }
  }

  if (data.type === 'glycemie') {
    if (!estDansLesBornes(data.valeur1, BORNES.glycemie.valeur1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valeur1'],
        message: `valeur1 doit être compris entre ${BORNES.glycemie.valeur1[0]} et ${BORNES.glycemie.valeur1[1]} mg/dL`,
      });
    }
    if (data.valeur2 != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valeur2'],
        message: "valeur2 ne s'applique pas à une mesure de glycémie",
      });
    }
    if (data.pouls != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pouls'],
        message: "pouls ne s'applique pas à une mesure de glycémie",
      });
    }
  }

  if (data.dateHeure.getTime() > Date.now() + CINQ_MINUTES_MS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dateHeure'],
      message: 'dateHeure ne peut pas être dans le futur',
    });
  }
}

// Schéma utilisé pour la création (POST /mesures) : tous les champs
// obligatoires doivent être présents, puis les règles métier s'appliquent.
export const creerMesureSchema = mesureFieldsSchema.superRefine(mesureBusinessRules);

// Schéma utilisé pour la mise à jour partielle (PATCH /mesures/:id) :
// chaque champ devient optionnel puisque l'utilisateur n'envoie que ce
// qu'il modifie. Les règles métier ne sont volontairement PAS appliquées
// ici : elles sont vérifiées par le contrôleur sur l'état complet obtenu
// après fusion avec la mesure existante.
export const modifierMesureSchema = mesureFieldsSchema.partial();

// Schéma des paramètres de filtre pour GET /mesures (?type=&from=&to=).
export const listerMesuresQuerySchema = z
  .object({
    type: z.enum(TYPES_MESURE).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: 'from doit être antérieur ou égal à to',
    path: ['from'],
  });
