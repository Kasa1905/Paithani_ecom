import { Schema, Types, model, models } from 'mongoose';

const OrderItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: { type: AddressSchema, required: false }, // Optional for backward compatibility with existing orders
    // Tracks whether stock was deducted at order creation. New orders set this to true.
    stockDeducted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['received', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'received',
    },
    payment: {
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
      },
      amount: { type: Number },
      currency: { type: String, default: 'INR' },
    },
    deliveredAt: { type: Date },
    archivedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Order = models.Order || model('Order', OrderSchema);

export default Order;
