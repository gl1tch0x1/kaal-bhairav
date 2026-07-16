import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { NetworkNode, NetworkLink } from "@/db/schema";

export async function GET() {
  try {
    await connectDB();
    const [nodes, links] = await Promise.all([
      NetworkNode.find(),
      NetworkLink.find(),
    ]);
    return NextResponse.json({ success: true, data: { nodes, links } });
  } catch (error) {
    console.error("Error fetching network data:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
