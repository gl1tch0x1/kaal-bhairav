import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { CameraFeed, SurveillanceEvent } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    const cameras = await CameraFeed.find();
    const events = await SurveillanceEvent.find().sort({ timestamp: -1 }).populate('cameraId');
    return NextResponse.json({ success: true, data: { cameras, events } });
  } catch (error) {
    console.error("Error fetching surveillance data:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
