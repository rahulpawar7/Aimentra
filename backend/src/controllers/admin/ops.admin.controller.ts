import { Request, Response } from 'express';
import { Order, Coupon, AuditLog, User, Plan, Course, Entitlement } from '../../models';
import PaymentService from '../../services/payment.service';
import EntitlementService from '../../services/entitlement.service';
import { listCMS, upsertCMS } from '../cms.controller';

export const listOrders = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email')
        .populate('planId', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: { orders, total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const refundOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    if (order.status !== 'paid') {
      return res.status(400).json({ success: false, error: { message: 'Only paid orders can be refunded' } });
    }

    if (order.gatewayPaymentId && PaymentService.isConfigured()) {
      await PaymentService.refund(order.gatewayPaymentId);
    }

    order.status = 'refunded';
    await order.save();

    // Revoke entitlements tied to this order
    await Entitlement.updateMany(
      { orderId: order._id, status: 'active' },
      { status: 'revoked', revokedAt: new Date(), revokedBy: req.user?.id, revokedReason: 'refund' }
    );

    await AuditLog.create({
      actor: req.user?.id,
      actorRole: req.user?.role || 'admin',
      actorEmail: req.user?.email || '',
      action: 'order.refund',
      resourceType: 'Order',
      resourceId: order._id.toString(),
      ip: req.ip || '127.0.0.1',
      userAgent: String(req.headers['user-agent'] || ''),
    }).catch(() => undefined);

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const listCoupons = async (_req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    res.json({ success: true, data: coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getAnalytics = async (_req: Request, res: Response) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeSubscriptions,
      revenueAgg,
      newSignups,
      paidOrders,
      topCourses,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Entitlement.countDocuments({ status: 'active' }),
      Order.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ status: 'paid' }),
      Course.find({ status: 'published' }).sort({ learnerCount: -1 }).limit(5).select('title learnerCount slug'),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeSubscriptions,
        revenueThisMonth: revenueAgg[0]?.total || 0,
        newSignups,
        paidOrders,
        topCourses,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getAuditLog = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(),
    ]);
    res.json({ success: true, data: { logs, total } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const listEntitlements = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [entitlements, total] = await Promise.all([
      Entitlement.find(filter)
        .populate('userId', 'name email')
        .populate('planId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Entitlement.countDocuments(filter),
    ]);
    res.json({ success: true, data: { entitlements, total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const listCertificates = async (_req: Request, res: Response) => {
  try {
    const certificates = await (await import('../../models')).Certificate.find()
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .sort({ issuedAt: -1 })
      .limit(100);
    res.json({ success: true, data: certificates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export { listCMS, upsertCMS };
