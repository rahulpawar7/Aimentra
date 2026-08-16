import mongoose, { Document, Schema } from 'mongoose';

export type VideoAssetStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface IVideoAsset extends Document {
  lessonId?: mongoose.Types.ObjectId;
  originalFilename: string;
  originalUrl?: string;
  storageKey?: string;
  status: VideoAssetStatus;
  hlsManifestPath?: string;
  encryptionKeyId?: string;
  renditions: Array<{ quality: string; bandwidth: number; path: string }>;
  durationSeconds?: number;
  errorMessage?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const videoAssetSchema = new Schema<IVideoAsset>(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', index: true },
    originalFilename: { type: String, required: true },
    originalUrl: { type: String },
    storageKey: { type: String },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading',
    },
    hlsManifestPath: { type: String },
    encryptionKeyId: { type: String },
    renditions: [
      {
        quality: String,
        bandwidth: Number,
        path: String,
      },
    ],
    durationSeconds: { type: Number },
    errorMessage: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

const VideoAsset =
  (mongoose.models.VideoAsset as mongoose.Model<IVideoAsset>) ||
  mongoose.model<IVideoAsset>('VideoAsset', videoAssetSchema);

export default VideoAsset;
