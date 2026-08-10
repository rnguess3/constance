// Couche ACCÈS AUX DONNÉES pour les rappels — voir mesureRepository.js
// pour le raisonnement d'ensemble (seul endroit qui parle à Prisma).
import prisma from '../lib/prisma.js';

const VALEURS_PAR_DEFAUT = {
  rappelMatinActif: false,
  heureMatin: '08:00',
  rappelSoirActif: false,
  heureSoir: '20:00',
  fuseauHoraire: 'Europe/Paris',
};

export function trouverPreference(userId) {
  return prisma.preferenceRappel.findUnique({ where: { userId } });
}

// "upsert" : la ligne n'existe pas encore tant que l'utilisateur n'a
// jamais enregistré ses préférences — GET renvoie donc les valeurs par
// défaut sans créer de ligne, seul PUT en crée une.
export function enregistrerPreference(userId, donnees) {
  return prisma.preferenceRappel.upsert({
    where: { userId },
    create: { userId, ...donnees },
    update: donnees,
  });
}

export function valeursParDefaut(userId) {
  return { userId, ...VALEURS_PAR_DEFAUT };
}

export function creerOuMettreAJourAbonnement(userId, { endpoint, keys }) {
  return prisma.abonnementPush.upsert({
    where: { endpoint },
    create: { userId, endpoint, cleP256dh: keys.p256dh, cleAuth: keys.auth },
    // Un même endpoint ne peut appartenir qu'à un abonnement : si l'API
    // PushManager renvoie un endpoint déjà connu (réabonnement après
    // expiration des clés côté navigateur), on met simplement à jour les
    // clés plutôt que d'échouer sur la contrainte d'unicité.
    update: { userId, cleP256dh: keys.p256dh, cleAuth: keys.auth },
  });
}

export async function supprimerAbonnement(userId, endpoint) {
  await prisma.abonnementPush.deleteMany({ where: { userId, endpoint } });
}
