import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyOTP } from "@/lib/otpService";
import { cookies } from "next/headers";
import { signToken } from "@/lib/jwt";

/**
 * POST /api/auth/verify-otp
 * Verify OTP sent to user's email/phone
 * 
 * Required fields:
 * - userId: User ID returned from registration
 * - otp: 6-digit OTP entered by user
 * - otpType: 'email' or 'phone' (default: email)
 */
export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId, otp, otpType = 'email' } = await req.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { message: "User ID and OTP are required" },
        { status: 400 }
      );
    }

    // Find user and include OTP fields (normally hidden)
    const user = await User.findById(userId).select('+otp +otpExpiresAt +otpType');
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Verify OTP
    const otpVerification = verifyOTP(otp, user.otp || '', user.otpExpiresAt);
    if (!otpVerification.valid) {
      return NextResponse.json(
        { message: otpVerification.error || "OTP verification failed" },
        { status: 400 }
      );
    }

    // Mark user as verified
    user.isEmailVerified = true;
    if (otpType === 'phone') {
      user.isPhoneVerified = true;
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpType = undefined;

    await user.save();

    // Generate JWT token and set cookie
    const token = signToken({ id: user._id, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return NextResponse.json(
      {
        message: "Email verified successfully. You are now logged in.",
        userId: user._id,
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VERIFY OTP ERROR]', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/resend-otp
 * Resend OTP to user
 */
export async function PUT(req: Request) {
  try {
    await connectDB();

    const { userId, otpType = 'email' } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isEmailVerified && otpType === 'email') {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 400 }
      );
    }

    if (user.isPhoneVerified && otpType === 'phone') {
      return NextResponse.json(
        { message: "Phone already verified" },
        { status: 400 }
      );
    }

    // Generate new OTP
    const { generateOTP, getOTPExpirationTime, sendEmailOTP, sendPhoneOTP, hashOTP } = await import('@/lib/otpService');
    const newOtp = generateOTP();
    const newOtpExpiresAt = getOTPExpirationTime();
    const hashedNewOtp = await hashOTP(newOtp);

    user.otp = hashedNewOtp;
    user.otpExpiresAt = newOtpExpiresAt;
    user.otpType = otpType;
    await user.save();

    // Send OTP based on type
    let sendResult;
    if (otpType === 'phone') {
      sendResult = await sendPhoneOTP(user.phoneNumber, newOtp);
    } else {
      sendResult = await sendEmailOTP(user.email, newOtp);
    }

    if (!sendResult.success) {
      return NextResponse.json(
        { message: sendResult.error || "Failed to resend OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: `OTP resent to your ${otpType}` },
      { status: 200 }
    );
  } catch (error) {
    console.error('[RESEND OTP ERROR]', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
