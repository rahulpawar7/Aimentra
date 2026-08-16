import { Router } from 'express';
import { listPlans, getPlan } from '../controllers/plan.controller';

const router = Router();

router.get('/', listPlans);
router.get('/:slug', getPlan);

export default router;
