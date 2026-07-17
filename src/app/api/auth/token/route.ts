import { NextResponse } from "next/server";
import { getSession, signShortToken } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await signShortToken(session);
  return NextResponse.json({ success: true, token });
}
