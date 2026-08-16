import mongoose, { Document, Schema } from 'mongoose';

export type LessonType = 'video' | 'audio' | 'pdf' | 'ebook' | 'image' | 'text' | 'quiz' | 'assignment' | 'external' | 'download' | 'live_session' | 'replay' | 'workbook' | 'template' | 'checklist';
export type LessonStatus = 'draft' | 'published' | 'archived';

export interface ILesson extends Document {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: LessonType;
  // Video
  videoUrl?: string;
  videoPublicId?: string;
  videoDuration?: number; // seconds
  videoThumbnail?: string;
  videoPoster?: string;
  videoTranscript?: string;
  videoSubtitles?: Array<{ lang: string; url: string; label: string }>;
  // Document/file
  fileUrl?: string;
  filePublicId?: string;
  fileName?: string;
  fileSize?: number;
  // Text content
  content?: string;
  // External resource
  externalUrl?: string;
  // Live session
  liveUrl?: string;
  liveStartTime?: Date;
  liveEndTime?: Date;
  // Settings
  sortOrder: number;
  status: LessonStatus;
  isFree: boolean;
  isPreview: boolean;
  previewDurationSeconds?: number;
  downloadable: boolean;
  requiredPreviousLessonId?: mongoose.Types.ObjectId;
  dripAfterDays?: number;
  dripDate?: Date;
  // Quiz/Assignment ref
  quizId?: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
}

const lessonSchema = new Schema<ILesson>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['video', 'audio', 'pdf', 'ebook', 'image', 'text', 'quiz', 'assignment', 'external', 'download', 'live_session', 'replay', 'workbook', 'template', 'checklist'],
      required: true,
    },
    videoUrl: { type: String },
    videoPublicId: { type: String },
    videoDuration: { type: Number },
    videoThumbnail: { type: String },
    videoPoster: { type: String },
    videoTranscript: { type: String },
    videoSubtitles: [{
      lang: String,
      url: String,
      label: String,
    }],
    fileUrl: { type: String },
    filePublicId: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    content: { type: String },
    externalUrl: { type: String },
    liveUrl: { type: String },
    liveStartTime: { type: Date },
    liveEndTime: { type: Date },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    isFree: { type: Boolean, default: false },
    isPreview: { type: Boolean, default: false },
    previewDurationSeconds: { type: Number },
    downloadable: { type: Boolean, default: false },
    requiredPreviousLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
    dripAfterDays: { type: Number },
    dripDate: { type: Date },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz' },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment' },
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, moduleId: 1, sortOrder: 1 });

const Lesson = (mongoose.models.Lesson as mongoose.Model<ILesson>) || mongoose.model<ILesson>('Lesson', lessonSchema);
export default Lesson;
