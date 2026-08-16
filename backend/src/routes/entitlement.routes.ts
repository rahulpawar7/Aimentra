import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { Entitlement } from '../models';

const router = Router();

router.get('/my', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const entitlements = await Entitlement.find({ userId, status: 'active' }).populate('planId');
    res.json({ success: true, data: entitlements });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export default router;
