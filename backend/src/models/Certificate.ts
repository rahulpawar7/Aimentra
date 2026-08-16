import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  certificateNumber: string;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: Date;
  issuedAt: Date;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revokedReason?: string;
  templateId?: string;
  qrCodeUrl?: string;
  downloadUrl?: string;
  verificationUrl?: string;
  status: 'issued' | 'revoked';
}

const CertificateSchema = new Schema<ICertificate>({
  certificateNumber: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  studentName: { type: String, required: true },
  courseName: { type: String, required: true },
  instructorName: { type: String, required: true },
  completionDate: { type: Date, required: true },
  issuedAt: { type: Date, required: true, default: Date.now },
  revokedAt: { type: Date },
  revokedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  revokedReason: { type: String },
  templateId: { type: String },
  qrCodeUrl: { type: String },
  downloadUrl: { type: String },
  verificationUrl: { type: String },
  status: { type: String, enum: ['issued', 'revoked'], default: 'issued', required: true }
}, {
  timestamps: true
});

CertificateSchema.index({ certificateNumber: 1 });
CertificateSchema.index({ userId: 1 });

const Certificate = (mongoose.models.Certificate as mongoose.Model<ICertificate>) || mongoose.model<ICertificate>('Certificate', CertificateSchema);
export default Certificate;
