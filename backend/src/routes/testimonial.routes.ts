import { Router } from 'express';
import { requireAdmin, optionalAuth } from '../middleware/auth';
import * as testimonialController from '../controllers/testimonial.controller';

const router = Router();

router.get('/', optionalAuth, testimonialController.listTestimonials);
router.post('/', requireAdmin, testimonialController.createTestimonial);
router.put('/:id', requireAdmin, testimonialController.updateTestimonial);
router.delete('/:id', requireAdmin, testimonialController.deleteTestimonial);

export default router;
