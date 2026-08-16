import mongoose, { Document, Schema } from 'mongoose';

export type CourseStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  thumbnail: string;
  banner?: string;
  previewVideo?: string;
  instructor: mongoose.Types.ObjectId;
  instructorName: string;
  instructorBio?: string;
  instructorAvatar?: string;
  category: mongoose.Types.ObjectId;
  tags: string[];
  difficulty: CourseDifficulty;
  language: string;
  totalDuration: number; // minutes
  moduleCount: number;
  lessonCount: number;
  resourceCount: number;
  learnerCount: number;
  completionCount: number;
  rating: number;
  reviewCount: number;
  status: CourseStatus;
  featured: boolean;
  sortOrder: number;
  publishedAt?: Date;
  scheduledAt?: Date;
  // What you'll learn
  whatYouLearn: string[];
  benefits: string[];
  requirements: string[];
  forWhom: string[];
  // Landing page sections
  curriculum?: object;
  faqs?: Array<{ question: string; answer: string }>;
  bonuses?: Array<{ title: string; description: string; value: string; image?: string }>;
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  // Settings
  completionPercentageRequired: number;
  certificateEnabled: boolean;
  communityEnabled: boolean;
  downloadEnabled: boolean;
  drip: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    shortDescription: { type: String, required: true, maxlength: 500 },
    fullDescription: { type: String, required: true },
    thumbnail: { type: String, required: true },
    banner: { type: String },
    previewVideo: { type: String },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    instructorName: { type: String, required: true },
    instructorBio: { type: String },
    instructorAvatar: { type: String },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [{ type: String, lowercase: true }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'all_levels'],
      default: 'all_levels',
    },
    language: { type: String, default: 'Hindi' },
    totalDuration: { type: Number, default: 0 },
    moduleCount: { type: Number, default: 0 },
    lessonCount: { type: Number, default: 0 },
    resourceCount: { type: Number, default: 0 },
    learnerCount: { type: Number, default: 0 },
    completionCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'review', 'scheduled', 'published', 'archived'],
      default: 'draft',
    },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    whatYouLearn: [String],
    benefits: [String],
    requirements: [String],
    forWhom: [String],
    curriculum: { type: Schema.Types.Mixed },
    faqs: [{ question: String, answer: String }],
    bonuses: [{
      title: String,
      description: String,
      value: String,
      image: String,
    }],
    seoTitle: { type: String },
    seoDescription: { type: String },
    seoKeywords: [String],
    completionPercentageRequired: { type: Number, default: 80 },
    certificateEnabled: { type: Boolean, default: true },
    communityEnabled: { type: Boolean, default: false },
    downloadEnabled: { type: Boolean, default: false },
    drip: { type: Boolean, default: false },
  },
  { timestamps: true }
);

courseSchema.index({ slug: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ featured: 1, status: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });

const Course = (mongoose.models.Course as mongoose.Model<ICourse>) || mongoose.model<ICourse>('Course', courseSchema);
export default Course;
