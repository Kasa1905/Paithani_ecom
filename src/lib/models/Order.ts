import { InferSchemaType, Schema, Types, model, models } from 'mongoose';

const OrderSchema = new Schema(
  {
    items: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    customerEmail: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type OrderDocument = InferSchemaType<typeof OrderSchema>;

const Order = models.Order || model('Order', OrderSchema);

export default Order;
