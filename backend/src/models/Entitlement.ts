import mongoose, { Document, Schema } from 'mongoose';

export type EntitlementStatus = 'active' | 'expired' | 'revoked' | 'pending';
export type EntitlementSource = 'purchase' | 'admin_grant' | 'free' | 'promo' | 'refund_reversal';

export interface IEntitlement extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  courses: mongoose.Types.ObjectId[];
  allCourses: boolean;
  status: EntitlementStatus;
  features: string[];
  startDate: Date;
  expiryDate?: Date;
  lifetime: boolean;
  grantedBy?: mongoose.Types.ObjectId;
  source: EntitlementSource;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revokedReason?: string;
  notes?: string;
}

const entitlementSchema = new Schema<IEntitlement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    allCourses: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked', 'pending'],
      default: 'active',
    },
    features: [String],
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    lifetime: { type: Boolean, default: false },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    source: {
      type: String,
      enum: ['purchase', 'admin_grant', 'free', 'promo', 'refund_reversal'],
      default: 'purchase',
    },
    revokedAt: { type: Date },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    revokedReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

entitlementSchema.index({ userId: 1, status: 1 });
entitlementSchema.index({ userId: 1, courses: 1 });
entitlementSchema.index({ expiryDate: 1 });

const Entitlement = (mongoose.models.Entitlement as mongoose.Model<IEntitlement>) || mongoose.model<IEntitlement>('Entitlement', entitlementSchema);
export default Entitlement;
