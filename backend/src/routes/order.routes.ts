import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  confirmPayment,
  verifyPayment,
  webhookHandler,
  applyCoupon,
} from '../controllers/order.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, createOrder);
router.post('/verify', requireAuth, verifyPayment);
router.post('/webhook', webhookHandler);
router.post('/apply-coupon', requireAuth, applyCoupon);
router.get('/', requireAuth, getMyOrders);
router.get('/:id', requireAuth, getOrder);
router.post('/:id/confirm', requireAuth, confirmPayment);

export default router;
