import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { ActivityLog, User } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const logs = await ActivityLog.find()
      .populate({ path: 'userId', select: 'username fullName', model: User })
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedLogs = logs.map(log => ({
      id: log._id.toString(),
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
      username: (log.userId as any)?.username,
      fullName: (log.userId as any)?.fullName,
    }));

    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
