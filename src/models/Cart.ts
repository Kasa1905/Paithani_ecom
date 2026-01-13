import { Schema, Types, model, models } from "mongoose";

const CartItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const CartSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Cart = models.Cart || model("Cart", CartSchema);

export default Cart;
