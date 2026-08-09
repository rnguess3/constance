// Couche ACCÈS AUX DONNÉES (repository) : seul endroit du projet qui
// parle directement à Prisma pour les mesures. Le reste du code (routes,
// contrôleurs) ne connaît que ces fonctions, jamais Prisma directement.
// Avantage concret : si un jour on change d'ORM ou qu'on ajoute du cache,
// un seul fichier à modifier, sans toucher aux contrôleurs ni aux routes.
import prisma from '../lib/prisma.js';

export function creer(data) {
  return prisma.mesure.create({ data });
}

export function lister({ userId, type, from, to }) {
  return prisma.mesure.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
      ...(from || to
        ? {
            dateHeure: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: { dateHeure: 'desc' },
  });
}

// Filtre systématiquement par userId : garantit qu'un utilisateur ne peut
// jamais lire, modifier ou supprimer la mesure d'un autre utilisateur,
// même en devinant/forçant un id existant.
export function trouverParId(id, userId) {
  return prisma.mesure.findFirst({ where: { id, userId } });
}

export function modifier(id, data) {
  return prisma.mesure.update({ where: { id }, data });
}

export function supprimer(id) {
  return prisma.mesure.delete({ where: { id } });
}
