import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'purchase' | 'course' | 'system' | 'expiry' | 'certificate';
  read: boolean;
  readAt?: Date;
  actionUrl?: string;
  icon?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  category: { type: String, enum: ['purchase', 'course', 'system', 'expiry', 'certificate'], required: true },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  actionUrl: { type: String },
  icon: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 } // TTL 90 days
}, {
  timestamps: true // Will add updatedAt automatically
});

const Notification = (mongoose.models.Notification as mongoose.Model<INotification>) || mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
