import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Report } from "@/db/schema";

export async function GET() {
  try {
    await connectDB();
    const reports = await Report.find().sort({ date: -1 });
    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
