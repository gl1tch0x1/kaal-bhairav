import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Target } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getSession();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const target = await Target.findById(id).lean();
      if (!target) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      return NextResponse.json({ success: true, data: target });
    }

    const targets = await Target.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: targets });
  } catch (error) {
    console.error("Error fetching targets:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getSession();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { type, value, label, notes, tags, risk } = body;

    if (!type || !value) {
      return NextResponse.json({ success: false, error: "type and value are required" }, { status: 400 });
    }

    const target = await Target.create({
      type,
      value,
      label: label || value,
      notes: notes || "",
      tags: tags || [],
      risk: risk || "info",
      lastSeen: new Date(),
      metadata: {},
    });

    return NextResponse.json({ success: true, data: target }, { status: 201 });
  } catch (error) {
    console.error("Error creating target:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getSession();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

    const result = await Target.findByIdAndDelete(id);
    if (!result) return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 });

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error("Error deleting target:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
