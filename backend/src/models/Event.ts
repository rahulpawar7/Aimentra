import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  banner?: string;
  date: Date;
  endDate: Date;
  timezone: string;
  venue?: string;
  isOnline: boolean;
  meetingUrl?: string;
  recordingUrl?: string;
  capacity?: number;
  registeredCount: number;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  eligiblePlans: mongoose.Types.ObjectId[];
  requiresRegistration: boolean;
  registrationDeadline?: Date;
  price: number;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
}

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  banner: { type: String },
  date: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timezone: { type: String, required: true },
  venue: { type: String },
  isOnline: { type: Boolean, default: true },
  meetingUrl: { type: String },
  recordingUrl: { type: String },
  capacity: { type: Number },
  registeredCount: { type: Number, default: 0 },
  status: { type: String, enum: ['upcoming', 'live', 'completed', 'cancelled'], default: 'upcoming' },
  eligiblePlans: [{ type: Schema.Types.ObjectId, ref: 'Plan' }],
  requiresRegistration: { type: Boolean, default: true },
  registrationDeadline: { type: Date },
  price: { type: Number, default: 0 },
  tags: [{ type: String }],
  seoTitle: { type: String },
  seoDescription: { type: String }
}, {
  timestamps: true
});

const Event = (mongoose.models.Event as mongoose.Model<IEvent>) || mongoose.model<IEvent>('Event', EventSchema);
export default Event;
