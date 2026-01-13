import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    // 1. Await cookies (IMPORTANT in Next 15+ / 16)
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Verify JWT
    const user = verifyToken(token);

    // 3. Success
    return NextResponse.json(
      { user },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/auth/me ERROR:', error);
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 401 }
    );
  }
}