// Instance unique (singleton) de PrismaClient, partagée par toute
// l'application. Chaque PrismaClient gère son propre pool de connexions
// PostgreSQL : en créer un nouveau à chaque requête HTTP épuiserait
// rapidement les connexions disponibles côté base de données.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
