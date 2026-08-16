import { Router } from 'express';
import { getPublicCMS } from '../controllers/cms.controller';

const router = Router();

router.get('/', getPublicCMS);
router.get('/:key', getPublicCMS);

export default router;
