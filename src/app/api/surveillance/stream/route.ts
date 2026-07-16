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
          // Fetch latest data
          const [cameras, events] = await Promise.all([
            CameraFeed.find({}).lean(),
            SurveillanceEvent.find({}).sort({ timestamp: -1 }).limit(20).lean()
          ]);

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
