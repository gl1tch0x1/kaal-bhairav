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

  let interval: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      await connectDB();

      const sendUpdate = async () => {
        try {
          const cameras = await CameraFeed.find().lean();
          const events = await SurveillanceEvent.find({}).sort({ timestamp: -1 }).limit(20).populate('cameraId').lean();

          const data = JSON.stringify({ cameras, events });
          controller.enqueue(`data: ${data}\n\n`);
        } catch (err) {
          console.error("SSE Surveillance Error:", err);
          clearInterval(interval);
          try {
            controller.close();
          } catch {}
        }
      };

      // Send immediate first update
      await sendUpdate();

      // Poll database every 5 seconds and push to client
      interval = setInterval(async () => {
        await sendUpdate();
      }, 5000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
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
