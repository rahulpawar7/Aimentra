import mongoose, { Document, Schema } from 'mongoose';

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  watchedSeconds: number;
  totalSeconds: number;
  percentage: number;
  completed: boolean;
  completedAt?: Date;
  lastPosition: number;
  startedAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  watchedSeconds: { type: Number, required: true, default: 0 },
  totalSeconds: { type: Number, required: true, default: 0 },
  percentage: { type: Number, required: true, default: 0, min: 0, max: 100 },
  completed: { type: Boolean, required: true, default: false },
  completedAt: { type: Date },
  lastPosition: { type: Number, required: true, default: 0 },
  startedAt: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true
});

ProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

const Progress = (mongoose.models.Progress as mongoose.Model<IProgress>) || mongoose.model<IProgress>('Progress', ProgressSchema);
export default Progress;
