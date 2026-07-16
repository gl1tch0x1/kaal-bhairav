import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Alert } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const conditions: any = { userId: session.userId };
    if (unreadOnly) conditions.isRead = false;

    const rows = await Alert.find(conditions).sort({ createdAt: -1 }).limit(20);

    return NextResponse.json({ alerts: rows.map(r => {
      const plain = r.toObject();
      plain.id = plain._id.toString();
      return plain;
    }) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    let alert = await Alert.create({
      userId: session.userId,
      ...body,
    });
    
    alert = alert.toObject();
    alert.id = alert._id.toString();

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await req.json();
    await Alert.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { isRead: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
