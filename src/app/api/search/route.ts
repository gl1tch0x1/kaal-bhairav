import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { SearchHistory, ActivityLog, OSINTResult } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { query, queryType, investigationId } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Fetch matching OSINT results from the database instead of generating mock ones
    let dbQuery: any = {
      $or: [
        { query: { $regex: new RegExp(query, "i") } },
        { title: { $regex: new RegExp(query, "i") } },
        { snippet: { $regex: new RegExp(query, "i") } }
      ]
    };
    if (queryType && queryType !== "all") {
      dbQuery.queryType = queryType;
    }

    const results = await OSINTResult.find(dbQuery).limit(50);

    const record = await SearchHistory.create({
      userId: auth.userId,
      investigationId: investigationId || null,
      query,
      queryType: queryType || "all",
      results: results,
      resultCount: results.length,
    });

    try {
      await ActivityLog.create({
        userId: auth.userId,
        action: "SEARCH",
        resource: "osint",
        details: { query, queryType, count: results.length },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      });
    } catch {}

    return NextResponse.json({ record, results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
