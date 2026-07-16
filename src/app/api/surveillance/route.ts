import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { CameraFeed, SurveillanceEvent } from "@/db/schema";

export async function GET() {
  try {
    await connectDB();
    const [cameras, events] = await Promise.all([
      CameraFeed.find(),
      SurveillanceEvent.find().sort({ timestamp: -1 }).populate('cameraId'),
    ]);
    return NextResponse.json({ success: true, data: { cameras, events } });
  } catch (error) {
    console.error("Error fetching surveillance data:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
