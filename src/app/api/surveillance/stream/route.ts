export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";
import { connectDB } from "@/db";
import { CameraFeed, SurveillanceEvent } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getSession();
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      await connectDB();

      const sendUpdate = async () => {
        try {
          let cameras = await CameraFeed.find().lean();
          if (cameras.length === 0) {
            const createdCams = await CameraFeed.create([
              { name: "HQ Core Server Room Cam 01", location: "Data Center Room A", status: "active", latency: 12, fps: 30, uptime: "99.9%" },
              { name: "Main Perimeter Gate 02", location: "North Entrance Fence", status: "active", latency: 28, fps: 25, uptime: "98.5%" },
              { name: "Executive Suite Foyer Cam 03", location: "East Wing Floor 3", status: "active", latency: 18, fps: 30, uptime: "99.2%" },
              { name: "Parking Area West PTZ 04", location: "Outdoors Main Gate", status: "active", latency: 45, fps: 20, uptime: "97.4%" }
            ]);

            await SurveillanceEvent.create([
              { cameraId: createdCams[0]._id, type: "SYSTEM", description: "Camera initialized and connected over RTSP", severity: "info", timestamp: new Date(Date.now() - 60000 * 30) },
              { cameraId: createdCams[1]._id, type: "MOTION", description: "Motion detected near boundary fence perimeter", severity: "medium", timestamp: new Date(Date.now() - 60000 * 15) },
              { cameraId: createdCams[2]._id, type: "ACCESS", description: "Authorized badge swipe detected at server entry door", severity: "info", timestamp: new Date(Date.now() - 60000 * 5) }
            ]);

            cameras = await CameraFeed.find().lean();
          }

          const events = await SurveillanceEvent.find({}).sort({ timestamp: -1 }).limit(20).populate('cameraId').lean();

          const data = JSON.stringify({ cameras, events });
          controller.enqueue(`data: ${data}\n\n`);
        } catch (err) {
          console.error("SSE Surveillance Error:", err);
        }
      };

      // Send immediate first update
      await sendUpdate();

      // Poll database every 5 seconds and push to client
      const interval = setInterval(async () => {
        await sendUpdate();
      }, 5000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
