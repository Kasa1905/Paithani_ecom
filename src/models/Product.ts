import mongoose, { InferSchemaType } from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: false, default: '' }, // Primary image from Cloudinary (optional)
    images: { type: [String], default: [] }, // Additional images (for future gallery)
    category: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isOutOfStock: { type: Boolean, default: false },
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
