import { Schema, Types, model, models } from 'mongoose';

const OrderItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['received', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'received',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Order = models.Order || model('Order', OrderSchema);

export default Order;
