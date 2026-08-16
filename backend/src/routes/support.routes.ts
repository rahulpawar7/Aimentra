import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import * as supportController from '../controllers/support.controller';

const router = Router();

// Admin routes must come before /:id to avoid "admin" being captured as id
router.get('/admin/all', requireAdmin, supportController.listAllTickets);
router.get('/admin/:id', requireAdmin, supportController.getAdminTicket);
router.patch('/admin/:id/assign', requireAdmin, supportController.assignTicket);
router.patch('/admin/:id/status', requireAdmin, supportController.updateTicketStatus);
router.post('/admin/:id/reply', requireAdmin, supportController.adminReplyToTicket);

router.post('/', requireAuth, supportController.createTicket);
router.get('/', requireAuth, supportController.listMyTickets);
router.get('/:id', requireAuth, supportController.getTicket);
router.post('/:id/reply', requireAuth, supportController.replyToTicket);

export default router;
