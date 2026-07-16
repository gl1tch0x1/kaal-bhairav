import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Target } from "@/db/schema";

export async function GET() {
  try {
    await connectDB();
    const targets = await Target.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: targets });
  } catch (error) {
    console.error("Error fetching targets:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
