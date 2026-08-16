import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  color?: string;
  parentId?: mongoose.Types.ObjectId;
  sortOrder: number;
  active: boolean;
  courseCount: number;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String },
  image: { type: String },
  color: { type: String },
  parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
  sortOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  courseCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

CategorySchema.index({ slug: 1 });

const Category = (mongoose.models.Category as mongoose.Model<ICategory>) || mongoose.model<ICategory>('Category', CategorySchema);
export default Category;
