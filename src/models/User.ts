import mongoose, { Schema, models } from "mongoose";

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
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // Mobile number - mandatory for new users, auto-assigned for existing
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    // Phone verification status
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    // Email verification via OTP
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // OTP for verification
    otp: {
      type: String,
      select: false, // Don't include in normal queries for security
    },
    // OTP expiration timestamp
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    // OTP type (email or phone)
    otpType: {
      type: String,
      enum: ['email', 'phone'],
      default: 'email',
      select: false,
    },
    // Saved addresses (optional, future-safe)
    addresses: {
      type: [AddressSchema],
      default: [],
    },
    role: {
      type: String,
      default: "user",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Note: 'unique: true' on phoneNumber already creates an index.
// Avoid declaring a duplicate index to prevent Mongoose warnings.

export default models.User || mongoose.model("User", UserSchema);