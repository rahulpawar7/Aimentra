import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxValue?: number;
  minOrderAmount?: number;
  applicablePlanIds: mongoose.Types.ObjectId[];
  applicableCourseIds: mongoose.Types.ObjectId[];
  userSpecificIds: mongoose.Types.ObjectId[];
  usageLimit?: number;
  usageCount: number;
  perUserLimit: number;
  validFrom: Date;
  validUntil: Date;
  active: boolean;
  description?: string;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  maxValue: { type: Number },
  minOrderAmount: { type: Number },
  applicablePlanIds: [{ type: Schema.Types.ObjectId, ref: 'Plan' }],
  applicableCourseIds: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  userSpecificIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  usageLimit: { type: Number },
  usageCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  active: { type: Boolean, default: true },
  description: { type: String }
}, {
  timestamps: true
});

CouponSchema.index({ code: 1 });

const Coupon = (mongoose.models.Coupon as mongoose.Model<ICoupon>) || mongoose.model<ICoupon>('Coupon', CouponSchema);
export default Coupon;
