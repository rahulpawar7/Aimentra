import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import * as eventController from '../controllers/event.controller';

const router = Router();

router.get('/', eventController.listEvents);
router.get('/my/registrations', requireAuth, eventController.getMyEventRegistrations);
router.post('/:id/register', requireAuth, eventController.registerForEvent);
router.get('/:slug', eventController.getEventBySlug);
router.post('/', requireAdmin, eventController.createEvent);
router.put('/:id', requireAdmin, eventController.updateEvent);
router.delete('/:id', requireAdmin, eventController.deleteEvent);

export default router;
