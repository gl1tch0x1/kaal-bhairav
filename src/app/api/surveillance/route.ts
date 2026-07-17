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
    
    // Auto-initialize default cameras on-demand if database is empty
    let cameras = await CameraFeed.find();
    if (cameras.length === 0) {
      cameras = await CameraFeed.create([
        { name: "HQ Core Server Room Cam 01", location: "Data Center Room A", status: "active", latency: 12, fps: 30, uptime: "99.9%" },
        { name: "Main Perimeter Gate 02", location: "North Entrance Fence", status: "active", latency: 28, fps: 25, uptime: "98.5%" },
        { name: "Executive Suite Foyer Cam 03", location: "East Wing Floor 3", status: "active", latency: 18, fps: 30, uptime: "99.2%" },
        { name: "Parking Area West PTZ 04", location: "Outdoors Main Gate", status: "active", latency: 45, fps: 20, uptime: "97.4%" }
      ]);

      // Seed initial dummy events linked to the newly created cameras
      await SurveillanceEvent.create([
        { cameraId: cameras[0]._id, type: "SYSTEM", description: "Camera initialized and connected over RTSP", severity: "info", timestamp: new Date(Date.now() - 60000 * 30) },
        { cameraId: cameras[1]._id, type: "MOTION", description: "Motion detected near boundary fence perimeter", severity: "medium", timestamp: new Date(Date.now() - 60000 * 15) },
        { cameraId: cameras[2]._id, type: "ACCESS", description: "Authorized badge swipe detected at server entry door", severity: "info", timestamp: new Date(Date.now() - 60000 * 5) }
      ]);
    }

    const events = await SurveillanceEvent.find().sort({ timestamp: -1 }).populate('cameraId');
    return NextResponse.json({ success: true, data: { cameras, events } });
  } catch (error) {
    console.error("Error fetching surveillance data:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
