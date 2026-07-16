export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";
import { connectDB } from "@/db";
import { FeedItem, Alert } from "@/db/schema";
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
          const [feed, alerts] = await Promise.all([
            FeedItem.find({}).sort({ time: -1 }).limit(50).lean(),
            Alert.find({ userId: auth.userId }).sort({ createdAt: -1 }).limit(10).lean()
          ]);

          const data = JSON.stringify({ feed, alerts });
          controller.enqueue(`data: ${data}\n\n`);
        } catch (err) {
          console.error("SSE Feed Error:", err);
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
