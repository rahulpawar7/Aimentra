import mongoose, { Document, Schema } from 'mongoose';

export interface ICMSContent extends Document {
  key: string;
  jsonValue: Record<string, unknown>;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

const cmsContentSchema = new Schema<ICMSContent>(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    jsonValue: { type: Schema.Types.Mixed, required: true, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

cmsContentSchema.index({ key: 1 });

const CMSContent =
  (mongoose.models.CMSContent as mongoose.Model<ICMSContent>) ||
  mongoose.model<ICMSContent>('CMSContent', cmsContentSchema);

export default CMSContent;
