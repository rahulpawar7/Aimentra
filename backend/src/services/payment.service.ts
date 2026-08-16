import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Order } from '../models';

let razorpayClient: Razorpay | null = null;

function getRazorpay(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  if (!razorpayClient) {
    razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpayClient;
}

export class PaymentService {
  isConfigured() {
    return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  getPublicKey() {
    return process.env.RAZORPAY_KEY_ID || '';
  }

  async createRazorpayOrder(order: {
    _id: { toString(): string };
    totalAmount: number;
    currency: string;
  }) {
    const client = getRazorpay();
    if (!client) {
      // Dev fallback: mock gateway order when keys are not set
      const mockId = `order_mock_${order._id.toString()}`;
      return {
        id: mockId,
        amount: Math.round(order.totalAmount * 100),
        currency: order.currency || 'INR',
        mock: true,
      };
    }

    const rpOrder = await client.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: order.currency || 'INR',
      receipt: order._id.toString(),
      notes: { orderId: order._id.toString() },
    });

    return { ...rpOrder, mock: false };
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      // Allow mock verification in development when Razorpay is not configured
      return params.signature.startsWith('mock_') || process.env.NODE_ENV !== 'production';
    }
    const body = `${params.orderId}|${params.paymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.signature));
    } catch {
      return false;
    }
  }

  async refund(gatewayPaymentId: string, amountPaise?: number) {
    const client = getRazorpay();
    if (!client) throw new Error('Razorpay not configured');
    if (amountPaise) {
      return client.payments.refund(gatewayPaymentId, { amount: amountPaise });
    }
    return client.payments.refund(gatewayPaymentId, {});
  }
}

export default new PaymentService();
