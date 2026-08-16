import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseCompletion extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  completedAt: Date;
  certificateIssued: boolean;
  certificateId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseCompletionSchema = new Schema<ICourseCompletion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    completedAt: { type: Date, required: true, default: Date.now },
    certificateIssued: { type: Boolean, default: false },
    certificateId: { type: Schema.Types.ObjectId, ref: 'Certificate' },
  },
  { timestamps: true }
);

courseCompletionSchema.index({ userId: 1, courseId: 1 }, { unique: true });
courseCompletionSchema.index({ userId: 1, completedAt: -1 });

const CourseCompletion =
  (mongoose.models.CourseCompletion as mongoose.Model<ICourseCompletion>) ||
  mongoose.model<ICourseCompletion>('CourseCompletion', courseCompletionSchema);

export default CourseCompletion;
