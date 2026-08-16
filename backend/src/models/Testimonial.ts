import mongoose, { Document, Schema } from 'mongoose';

export interface ITestimonial extends Document {
  name: string;
  designation?: string;
  company?: string;
  avatar?: string;
  content: string;
  rating: number;
  courseId?: mongoose.Types.ObjectId;
  featured: boolean;
  sortOrder: number;
  approved: boolean;
  source: 'manual' | 'google' | 'facebook';
}

const TestimonialSchema = new Schema<ITestimonial>({
  name: { type: String, required: true },
  designation: { type: String },
  company: { type: String },
  avatar: { type: String },
  content: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  featured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  approved: { type: Boolean, default: true },
  source: { type: String, enum: ['manual', 'google', 'facebook'], default: 'manual' }
}, {
  timestamps: true
});

const Testimonial = (mongoose.models.Testimonial as mongoose.Model<ITestimonial>) || mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);
export default Testimonial;
