import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { SearchHistory, ActivityLog, OSINTResult } from "@/db/schema";
import { getSession } from "@/lib/auth";

import { SearchSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const parsed = SearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { query, queryType, investigationId } = parsed.data;

    // Fetch matching OSINT results using MongoDB Text Index for maximum performance
    let dbQuery: any = {
      $text: { $search: query }
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
