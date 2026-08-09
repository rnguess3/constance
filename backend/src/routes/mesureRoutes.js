// Couche ROUTES : associe chaque verbe HTTP + chemin à une fonction du
// contrôleur. Ne contient aucune logique, juste du câblage.
import { Router } from 'express';
import { authTemporaire } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as mesureController from '../controllers/mesureController.js';

const router = Router();

// Toutes les routes /mesures nécessitent un utilisateur authentifié.
router.use(authTemporaire);

router.post('/', asyncHandler(mesureController.creerMesure));
router.get('/', asyncHandler(mesureController.listerMesures));
router.patch('/:id', asyncHandler(mesureController.modifierMesure));
router.delete('/:id', asyncHandler(mesureController.supprimerMesure));

export default router;
