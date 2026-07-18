import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/db";
import { SearchHistory, ActivityLog, OSINTResult } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { SearchSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const history = await SearchHistory.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("query queryType resultCount createdAt");

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Search history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { query, queryType, investigationId } = parsed.data;

    let results: any[] = [];
    let source = "db";

    // API GATEWAY PATTERN: Try Go Microservice (asset-service) first
    const GO_SERVICE_URL = process.env.GO_SERVICE_URL || "http://127.0.0.1:50051";
    try {
      const res = await fetch(`${GO_SERVICE_URL}/v1/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, queryType, investigationId }),
        // Increased timeout for web-check multi-source fetching
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          results = data.results;
          source = "asset-service";
          // Persist new results to MongoDB for history/future fallback
          try {
            const docs = results.map((r: any) => ({
              query: r.query || query,
              queryType: r.queryType || queryType || "domain",
              title: r.title,
              snippet: r.snippet,
              url: r.url,
              source: r.source,
              date: r.fetchedAt || new Date().toISOString(),
              riskScore: r.riskScore || 0,
              tags: r.tags || [],
            }));
            await OSINTResult.insertMany(docs, { ordered: false }).catch(() => {});
          } catch {}
        }
      }
    } catch (e) {
      console.warn(`[search] Go service failed (${GO_SERVICE_URL}): ${e}`);
    }

    // LEGACY FALLBACK: query stored OSINTResults from previous searches
    if (results.length === 0) {
      source = "db-fallback";
      try {
        const sanitizedQuery = query.replace(/["\\]/g, "");
        let dbQuery: any = {};
        // Try full-text first; fall back to regex if text index missing
        try {
          dbQuery = { $text: { $search: `"${sanitizedQuery}"` } };
          if (queryType && queryType !== "all" && queryType !== "general") {
            dbQuery.queryType = queryType;
          }
          results = await OSINTResult.find(dbQuery).limit(50).lean();
        } catch {
          // Text index not available; do regex search
          const re = new RegExp(sanitizedQuery, "i");
          const regexQuery: any = { $or: [{ query: re }, { title: re }, { snippet: re }] };
          if (queryType && queryType !== "all" && queryType !== "general") {
            regexQuery.queryType = queryType;
          }
          results = await OSINTResult.find(regexQuery).limit(50).lean();
        }
      } catch (dbErr) {
        console.error("[search] DB fallback failed:", dbErr);
      }
    }

    // Always save search history
    try {
      await SearchHistory.create({
        userId: auth.userId,
        investigationId: investigationId || null,
        query,
        queryType: queryType || "all",
        results: results.slice(0, 10), // store first 10 for history (save space)
        resultCount: results.length,
      });
    } catch {}

    try {
      await ActivityLog.create({
        userId: auth.userId,
        action: "SEARCH",
        resource: "osint",
        details: { query, queryType, count: results.length, source },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      });
    } catch {}

    return NextResponse.json({ results, count: results.length, source });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true") {
      const result = await SearchHistory.deleteMany({ userId: auth.userId });
      return NextResponse.json({ success: true, deleted: result.deletedCount, type: "all" });
    }

    if (id) {
      const result = await SearchHistory.findOneAndDelete({ _id: id, userId: auth.userId });
      if (!result) {
        return NextResponse.json({ error: "History item not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, deleted: 1, type: "single" });
    }

    return NextResponse.json({ error: "Provide ?id=<id> or ?all=true" }, { status: 400 });
  } catch (error) {
    console.error("Delete history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
