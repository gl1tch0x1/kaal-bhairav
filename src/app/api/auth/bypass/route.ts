import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response("Missing bypass token", { status: 400 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return new Response("Token expired or invalid", { status: 401 });
  }

  // Token is valid! Sign a new 24h session token for the phone browser session
  const sessionToken = await signToken(payload);

  const response = NextResponse.redirect(new URL("/dashboard/surveillance", req.url));

  response.cookies.set("osint_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours persistent cookie
    path: "/",
  });

  return response;
}
