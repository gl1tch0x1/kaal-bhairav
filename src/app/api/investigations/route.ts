import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Investigation, User, ActivityLog } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const severity = searchParams.get("severity") || "";
    const offset = (page - 1) * limit;

    const conditions: any = {};
    if (search) {
      conditions.$or = [
        { title: { $regex: search, $options: "i" } },
        { targetValue: { $regex: search, $options: "i" } }
      ];
    }
    if (status) conditions.status = status;
    if (severity) conditions.severity = severity;

    const rows = await Investigation.find(conditions)
      .populate({ path: 'createdBy', select: 'username fullName', model: User })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const formattedRows = rows.map(r => {
      const plain = r.toObject();
      plain.id = plain._id.toString();
      plain.createdByName = (r.createdBy as any)?.fullName;
      plain.createdByUsername = (r.createdBy as any)?.username;
      return plain;
    });

    const total = await Investigation.countDocuments(conditions);

    return NextResponse.json({ investigations: formattedRows, total, page, limit });
  } catch (error) {
    console.error("Investigations GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { title, description, status, severity, targetType, targetValue, tags } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let investigation = await Investigation.create({
      title,
      description,
      status: status || "active",
      severity: severity || "medium",
      targetType: targetType || "person",
      targetValue,
      tags,
      createdBy: session.userId,
      assignedTo: session.userId,
    });

    investigation = investigation.toObject();
    investigation.id = investigation._id.toString();

    try {
      await ActivityLog.create({
        userId: session.userId,
        action: "CREATE_INVESTIGATION",
        resource: "investigation",
        resourceId: investigation.id,
        details: { title },
      });
    } catch {}

    return NextResponse.json({ investigation }, { status: 201 });
  } catch (error) {
    console.error("Investigations POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
