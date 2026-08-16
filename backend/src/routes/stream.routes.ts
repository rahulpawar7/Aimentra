import { Router } from 'express';
import {
  issueStreamToken,
  getManifest,
  getSegment,
  getEncryptionKey,
} from '../controllers/stream.controller';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/token/:lessonId', requireAuth, issueStreamToken);
router.get('/manifest/:lessonId', optionalAuth, getManifest);
router.get('/segment/:lessonId/:segment', getSegment);
router.get('/key/:lessonId', getEncryptionKey);

export default router;
