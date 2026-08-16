import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, userController.updateProfile);
router.put('/avatar', requireAuth, userController.updateAvatar);
router.get('/subscription', requireAuth, userController.getMySubscription);
router.get('/sessions', requireAuth, userController.getSessions);
router.delete('/sessions/:sessionId', requireAuth, userController.deleteSession);
router.delete('/sessions', requireAuth, userController.deleteAllSessions);

export default router;
