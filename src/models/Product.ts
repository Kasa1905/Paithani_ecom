import mongoose, { InferSchemaType } from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    category: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type ProductDocument = InferSchemaType<typeof ProductSchema>;

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;
