import { Router } from 'express';
import { getPublicStats, getHomepageStats } from '../controllers/stats.controller';

const router = Router();

router.get('/', getPublicStats);
router.get('/homepage', getHomepageStats);

export default router;
