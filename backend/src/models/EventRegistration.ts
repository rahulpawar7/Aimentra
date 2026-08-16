import mongoose, { Document, Schema } from 'mongoose';

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'registered' | 'cancelled';
  registeredAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['registered', 'cancelled'], default: 'registered' },
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventRegistration = (mongoose.models.EventRegistration as mongoose.Model<IEventRegistration>)
  || mongoose.model<IEventRegistration>('EventRegistration', EventRegistrationSchema);

export default EventRegistration;
