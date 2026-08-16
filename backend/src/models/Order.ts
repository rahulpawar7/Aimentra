import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  courseIds: mongoose.Types.ObjectId[];
  amount: number;
  subtotal: number;
  gstAmount: number;
  gstPercent: number;
  totalAmount: number;
  currency: string;
  couponId?: mongoose.Types.ObjectId;
  couponCode?: string;
  discountAmount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  paymentGateway: 'razorpay' | 'free' | 'manual';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  billingDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
    gstin?: string;
    state: string;
  };
  invoiceNumber?: string;
  invoiceUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
  courseIds: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  amount: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  gstAmount: { type: Number, required: true, default: 0 },
  gstPercent: { type: Number, required: true, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'INR' },
  couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
  couponCode: { type: String },
  discountAmount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'], default: 'pending', required: true },
  paymentGateway: { type: String, enum: ['razorpay', 'free', 'manual'], required: true },
  gatewayOrderId: { type: String },
  gatewayPaymentId: { type: String },
  billingDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    gstin: { type: String },
    state: { type: String, required: true }
  },
  invoiceNumber: { type: String },
  invoiceUrl: { type: String },
  notes: { type: String }
}, {
  timestamps: true
});

OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

const Order = (mongoose.models.Order as mongoose.Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
