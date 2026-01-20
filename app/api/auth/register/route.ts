import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateOTP, getOTPExpirationTime, sendEmailOTP, hashOTP } from "@/lib/otpService";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { name, email, phoneNumber, password } = await req.json();

    // Validation
    if (!name || !email || !phoneNumber || !password) {
      return NextResponse.json(
        { message: "Name, email, phone number, and password are required" },
        { status: 400 }
      );
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { message: "Invalid phone number. Must be 10 digits." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return NextResponse.json(
        { message: "Phone number already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = getOTPExpirationTime();
    const hashedOtp = await hashOTP(otp);

    // Create user (but not verified yet)
    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      otp: hashedOtp, // Store hashed OTP
      otpExpiresAt,
      otpType: 'email',
      isEmailVerified: false,
      isPhoneVerified: false,
    });

    // Send OTP via email
    const emailResult = await sendEmailOTP(email, otp);
    if (!emailResult.success) {
      // Clean up user if OTP send fails
      await User.deleteOne({ _id: user._id });
      return NextResponse.json(
        { message: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "Registration successful. OTP sent to your email.",
        userId: user._id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}