import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { FeedItem } from "@/db/schema";

export async function GET() {
  try {
    await connectDB();
    const feed = await FeedItem.find().sort({ time: -1 });
    return NextResponse.json({ success: true, data: feed });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
