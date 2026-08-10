// Couche ROUTES pour les rappels — voir mesureRoutes.js.
import { Router } from 'express';
import { exigerUtilisateurConnecte } from '../middleware/clerkAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as rappelController from '../controllers/rappelController.js';

const router = Router();

router.use(exigerUtilisateurConnecte);

router.get('/reglages', asyncHandler(rappelController.obtenirReglages));
router.put('/reglages', asyncHandler(rappelController.modifierReglages));
router.post('/abonnements', asyncHandler(rappelController.creerAbonnement));
router.delete('/abonnements', asyncHandler(rappelController.supprimerAbonnement));

export default router;
