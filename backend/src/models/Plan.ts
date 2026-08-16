import mongoose, { Document, Schema } from 'mongoose';

export type BillingType = 'one_time' | 'annual' | 'lifetime';
export type PlanStatus = 'active' | 'inactive' | 'archived';

export interface IPlan extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  badge?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  gstPercent: number;
  billingType: BillingType;
  durationDays?: number;
  lifetime: boolean;
  status: PlanStatus;
  featured: boolean;
  sortOrder: number;
  // Course access
  courses: mongoose.Types.ObjectId[]; // specific courses
  allCourses: boolean;
  categories: mongoose.Types.ObjectId[];
  // Features (permission keys)
  features: string[];
  // Restrictions
  maxDevices: number;
  maxConcurrentSessions: number;
  videoDownloadable: boolean;
  pdfDownloadable: boolean;
  communityAccess: boolean;
  communityType?: string;
  communityUrl?: string;
  supportLevel: 'none' | 'basic' | 'priority' | 'vip';
  certificateEnabled: boolean;
  futureUpdates: boolean;
  // Display
  highlights: string[];
  color?: string;
  icon?: string;
  offerEndsAt?: Date;
  maxSeats?: number;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    badge: { type: String },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number },
    currency: { type: String, default: 'INR' },
    gstPercent: { type: Number, default: 18 },
    billingType: { type: String, enum: ['one_time', 'annual', 'lifetime'], default: 'one_time' },
    durationDays: { type: Number },
    lifetime: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    allCourses: { type: Boolean, default: false },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    features: [{ type: String }],
    maxDevices: { type: Number, default: 3 },
    maxConcurrentSessions: { type: Number, default: 1 },
    videoDownloadable: { type: Boolean, default: false },
    pdfDownloadable: { type: Boolean, default: true },
    communityAccess: { type: Boolean, default: false },
    communityType: { type: String },
    communityUrl: { type: String },
    supportLevel: { type: String, enum: ['none', 'basic', 'priority', 'vip'], default: 'basic' },
    certificateEnabled: { type: Boolean, default: true },
    futureUpdates: { type: Boolean, default: false },
    highlights: [String],
    color: { type: String },
    icon: { type: String },
    offerEndsAt: { type: Date },
    maxSeats: { type: Number },
  },
  { timestamps: true }
);

planSchema.index({ slug: 1 });
planSchema.index({ status: 1, sortOrder: 1 });

const Plan = (mongoose.models.Plan as mongoose.Model<IPlan>) || mongoose.model<IPlan>('Plan', planSchema);
export default Plan;
