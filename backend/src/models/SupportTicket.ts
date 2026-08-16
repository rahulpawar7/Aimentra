import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportTicketMessage {
  sender: mongoose.Types.ObjectId;
  role: 'user' | 'admin' | 'support';
  content: string;
  attachments: string[];
  timestamp: Date;
}

export interface ISupportTicket extends Document {
  ticketId: string;
  userId: mongoose.Types.ObjectId;
  subject: string;
  category: 'technical' | 'billing' | 'course' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  messages: ISupportTicketMessage[];
  assignedTo?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  closedAt?: Date;
}

const TicketMessageSchema = new Schema<ISupportTicketMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'admin', 'support'], required: true },
  content: { type: String, required: true },
  attachments: [{ type: String }],
  timestamp: { type: Date, default: Date.now }
});

const SupportTicketSchema = new Schema<ISupportTicket>({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  category: { type: String, enum: ['technical', 'billing', 'course', 'general'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'], default: 'open' },
  messages: [TicketMessageSchema],
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  closedAt: { type: Date }
}, {
  timestamps: true
});

const SupportTicket = (mongoose.models.SupportTicket as mongoose.Model<ISupportTicket>) || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
export default SupportTicket;
