import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User, ActivityLog } from "@/db/schema";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { LoginSchema } from "@/lib/validations";
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { username, password } = parsed.data;

    let user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log activity
    try {
      await ActivityLog.create({
        userId: user._id,
        action: "LOGIN",
        resource: "auth",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      });
    } catch {}

    const token = await signToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || "analyst",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });

    response.cookies.set("osint_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
