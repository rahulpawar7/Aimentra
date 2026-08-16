import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseModule extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  thumbnail?: string;
  sortOrder: number;
  published: boolean;
  lessonCount: number;
  totalDuration: number;
  dripAfterDays?: number;
  dripAfterModuleId?: mongoose.Types.ObjectId;
}

const moduleSchema = new Schema<ICourseModule>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String },
    thumbnail: { type: String },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    lessonCount: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    dripAfterDays: { type: Number },
    dripAfterModuleId: { type: Schema.Types.ObjectId, ref: 'CourseModule' },
  },
  { timestamps: true }
);

moduleSchema.index({ courseId: 1, sortOrder: 1 });

const CourseModule = (mongoose.models.CourseModule as mongoose.Model<ICourseModule>) || mongoose.model<ICourseModule>('CourseModule', moduleSchema);
export default CourseModule;
