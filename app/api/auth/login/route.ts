import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import { signToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Check if user has verified email (skip for admin users)
    if (!user.isEmailVerified && user.role !== 'admin') {
      return NextResponse.json(
        { 
          message: "Please verify your email first",
          userId: user._id,
          email: user.email,
          requiresVerification: true
        },
        { status: 403 } // Forbidden until verified
      );
    }

    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    // Set auth token cookie
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: false, // MUST be false for localhost
      path: "/",
    });

    return response;
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
 