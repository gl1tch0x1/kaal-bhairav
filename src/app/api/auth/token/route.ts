import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/db";
import { PairingToken } from "@/db/schema";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const pairingId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    await PairingToken.create({
      pairingId,
      payload: {
        userId: session.userId,
        username: session.username,
        email: session.email,
        role: session.role,
      },
      expiresAt,
    });

    return NextResponse.json({ success: true, pairingId });
  } catch (error) {
    console.error("Failed to generate pairing token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
