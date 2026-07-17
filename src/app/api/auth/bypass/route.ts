import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { connectDB } from "@/db";
import { PairingToken } from "@/db/schema";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing bypass identifier", { status: 400 });
  }

  await connectDB();

  // Find and immediately delete the token to prevent replay attacks (Single-Use OTP)
  const pairingDoc = await PairingToken.findOneAndDelete({ pairingId: id });

  if (!pairingDoc) {
    return new Response("Bypass pairing link is invalid or expired", { status: 401 });
  }

  // Ensure it has not expired yet (MongoDB TTL index runs periodically, so double check manually)
  if (pairingDoc.expiresAt.getTime() < Date.now()) {
    return new Response("Bypass pairing link has expired", { status: 401 });
  }

  const payload = pairingDoc.payload;

  // Sign a new 24h session token for the phone browser session
  const sessionToken = await signToken({
    userId: payload.userId,
    username: payload.username,
    email: payload.email,
    role: payload.role || "analyst",
  });

  const response = NextResponse.redirect(new URL("/dashboard/surveillance", req.url));

  const isProduction = process.env.NODE_ENV === "production";
  const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";

  response.cookies.set("osint_token", sessionToken, {
    httpOnly: true,
    secure: isProduction || isHttps,
    sameSite: "strict", // Hardened SameSite rule
    maxAge: 60 * 60 * 24, // 24 hours persistent cookie
    path: "/",
  });

  return response;
}
