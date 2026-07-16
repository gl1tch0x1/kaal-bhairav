import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { DataSource } from "@/db/schema";

export async function GET() {
  try {
    await connectDB();
    const sources = await DataSource.find();
    return NextResponse.json({ success: true, data: sources });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
