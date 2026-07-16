import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Investigation } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const investigation = await Investigation.findById(id);

    if (!investigation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const plain = investigation.toObject();
    plain.id = plain._id.toString();

    return NextResponse.json({ investigation: plain });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updated = await Investigation.findByIdAndUpdate(id, { ...body, updatedAt: new Date() }, { new: true });
    
    if(!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const plain = updated.toObject();
    plain.id = plain._id.toString();

    return NextResponse.json({ investigation: plain });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    await Investigation.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
