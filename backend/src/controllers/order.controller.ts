import { Request, Response } from 'express';
import { Order, Plan, Coupon } from '../models';
import EntitlementService from '../services/entitlement.service';
import PaymentService from '../services/payment.service';
import EmailService from '../services/email.service';
import NotificationService from '../services/notification.service';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { planId, couponCode, billingDetails } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const plan = await Plan.findById(planId);
    if (!plan || plan.status !== 'active') {
      return res.status(404).json({ success: false, error: { message: 'Plan not found or inactive' } });
    }

    // Snapshot price at click time so later plan edits don't change in-flight checkout
    let subtotal = plan.price;
    let discountAmount = 0;
    let couponId = undefined;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (!coupon) {
        return res.status(400).json({ success: false, error: { message: 'Invalid coupon code' } });
      }
      const now = new Date();
      if (coupon.validUntil < now || coupon.validFrom > now) {
        return res.status(400).json({ success: false, error: { message: 'Coupon expired or not yet valid' } });
      }
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({ success: false, error: { message: 'Coupon usage limit reached' } });
      }
      if (coupon.applicablePlanIds?.length && !coupon.applicablePlanIds.map(String).includes(plan._id.toString())) {
        return res.status(400).json({ success: false, error: { message: 'Coupon not valid for this plan' } });
      }

      if (coupon.type === 'percentage') {
        discountAmount = (subtotal * coupon.value) / 100;
        if (coupon.maxValue) discountAmount = Math.min(discountAmount, coupon.maxValue);
      } else {
        discountAmount = coupon.value;
      }
      discountAmount = Math.min(subtotal, discountAmount);
      couponId = coupon._id;
    }

    const gstPercent = plan.gstPercent || 18;
    const discountedSubtotal = subtotal - discountAmount;
    const gstAmount = Math.round((discountedSubtotal * gstPercent) / 100);
    const totalAmount = discountedSubtotal + gstAmount;

    const isFree = totalAmount <= 0;

    const PAYMENT_GATEWAY_ENABLED = process.env.PAYMENT_GATEWAY_ENABLED === 'true';

    const order = new Order({
      userId,
      planId: plan._id,
      courseIds: plan.courses || [],
      amount: discountedSubtotal,
      subtotal,
      gstAmount,
      gstPercent,
      totalAmount,
      currency: plan.currency || 'INR',
      couponId,
      couponCode: couponCode ? couponCode.toUpperCase() : undefined,
      discountAmount,
      status: isFree || !PAYMENT_GATEWAY_ENABLED ? 'paid' : 'pending',
      paymentGateway: isFree ? 'free' : PAYMENT_GATEWAY_ENABLED ? 'razorpay' : 'manual',
      // Price snapshot fields stored on order for audit
      notes: `Plan snapshot: ${plan.name} @ ₹${plan.price}`,
      billingDetails: billingDetails || {
        name: 'User',
        email: req.user?.email || 'user@example.com',
        phone: '0000000000',
        address: 'India',
        state: 'Maharashtra',
      },
    });

    if (isFree || !PAYMENT_GATEWAY_ENABLED) {
      order.invoiceNumber = `INV-2026-${Date.now().toString().slice(-6)}`;
      await order.save();
      if (order.couponId) {
        await Coupon.findByIdAndUpdate(order.couponId, { $inc: { usageCount: 1 } });
      }
      // Grant access to exactly this plan's courses/entitlements immediately —
      // downstream dashboard/library/course-access all read from this entitlement,
      // so unlocked content is fully dynamic based on the plan the user selected.
      const entitlement = await EntitlementService.createEntitlement(
        userId.toString(),
        plan._id.toString(),
        order._id.toString()
      );
      if (req.user?.email) {
        EmailService.sendPurchaseConfirmation(req.user.email, plan.name, order.totalAmount).catch(() => {});
      }
      NotificationService.notifyPurchase(userId.toString(), plan.name, order._id.toString()).catch(() => {});
      return res.status(201).json({
        success: true,
        data: { order, entitlement, free: isFree },
      });
    }

    // --- Real Razorpay flow (currently unreachable while gateway is disabled) ---
    const rpOrder = await PaymentService.createRazorpayOrder(order);
    order.gatewayOrderId = rpOrder.id;
    await order.save();

    res.status(201).json({
      success: true,
      data: {
        order,
        razorpay: {
          key: PaymentService.getPublicKey() || 'rzp_test_mock',
          orderId: rpOrder.id,
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          mock: (rpOrder as any).mock === true,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    }
    if (order.status === 'paid') {
      return res.status(200).json({ success: true, data: { order, alreadyPaid: true } });
    }

    const valid = PaymentService.verifyPaymentSignature({
      orderId: razorpayOrderId || order.gatewayOrderId || '',
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!valid) {
      order.status = 'failed';
      await order.save();
      return res.status(400).json({ success: false, error: { message: 'Payment signature verification failed' } });
    }

    order.status = 'paid';
    order.gatewayPaymentId = razorpayPaymentId;
    order.gatewayOrderId = razorpayOrderId || order.gatewayOrderId;
    order.invoiceNumber = `INV-2026-${Date.now().toString().slice(-6)}`;
    await order.save();

    if (order.couponId) {
      await Coupon.findByIdAndUpdate(order.couponId, { $inc: { usageCount: 1 } });
    }

    let entitlement = null;
    if (order.planId) {
      entitlement = await EntitlementService.createEntitlement(
        userId.toString(),
        order.planId.toString(),
        order._id.toString()
      );
    }

    const plan = order.planId ? await Plan.findById(order.planId) : null;
    if (req.user?.email && plan) {
      await EmailService.sendPurchaseConfirmation(req.user.email, plan.name, order.totalAmount);
    }

    res.status(200).json({ success: true, data: { order, entitlement } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const webhookHandler = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const ok = PaymentService.verifyWebhookSignature(rawBody, signature || '');
      if (!ok) {
        return res.status(400).json({ success: false, error: { message: 'Invalid webhook signature' } });
      }
    }

    const event = req.body?.event;
    const paymentEntity = req.body?.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      const gatewayOrderId = paymentEntity.order_id;
      const order = await Order.findOne({ gatewayOrderId, status: 'pending' });
      if (order) {
        order.status = 'paid';
        order.gatewayPaymentId = paymentEntity.id;
        order.invoiceNumber = order.invoiceNumber || `INV-2026-${Date.now().toString().slice(-6)}`;
        await order.save();

        if (order.planId) {
          await EntitlementService.createEntitlement(
            order.userId.toString(),
            order.planId.toString(),
            order._id.toString()
          );
        }
        if (order.couponId) {
          await Coupon.findByIdAndUpdate(order.couponId, { $inc: { usageCount: 1 } });
        }
      }
    }

    if (event === 'payment.failed' && paymentEntity) {
      await Order.findOneAndUpdate(
        { gatewayOrderId: paymentEntity.order_id, status: 'pending' },
        { status: 'failed' }
      );
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const applyCoupon = async (req: Request, res: Response) => {
  try {
    const { code, planId } = req.body;
    const coupon = await Coupon.findOne({ code: String(code).toUpperCase(), active: true });
    if (!coupon) {
      return res.status(404).json({ success: false, error: { message: 'Coupon not found' } });
    }
    const now = new Date();
    if (coupon.validUntil < now || coupon.validFrom > now) {
      return res.status(400).json({ success: false, error: { message: 'Coupon expired or not yet valid' } });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, error: { message: 'Coupon usage limit reached' } });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: { message: 'Plan not found' } });
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (plan.price * coupon.value) / 100;
      if (coupon.maxValue) discountAmount = Math.min(discountAmount, coupon.maxValue);
    } else {
      discountAmount = coupon.value;
    }
    discountAmount = Math.min(plan.price, discountAmount);

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discountAmount,
        finalPrice: Math.max(0, plan.price - discountAmount),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const userId = req.user?.id;

    const [orders, total] = await Promise.all([
      Order.find({ userId }).populate('planId', 'name badge price').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments({ userId }),
    ]);

    res.status(200).json({ success: true, data: { orders, total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const order = await Order.findOne({ _id: id, userId }).populate('planId');
    if (!order) {
      return res.status(404).json({ success: false, error: { message: 'Order not found' } });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

/** @deprecated Prefer verifyPayment — kept for backwards compatibility */
export const confirmPayment = async (req: Request, res: Response) => {
  req.body = {
    orderId: req.params.id,
    razorpayOrderId: req.body.razorpayOrderId || `order_mock_${req.params.id}`,
    razorpayPaymentId: req.body.razorpayPaymentId || `pay_mock_${Date.now()}`,
    razorpaySignature: req.body.razorpaySignature || `mock_${Date.now()}`,
  };
  return verifyPayment(req, res);
};
