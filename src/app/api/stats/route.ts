import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Investigation, User, Alert, SearchHistory } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const totalInvestigations = await Investigation.countDocuments();
    const activeInvestigations = await Investigation.countDocuments({ status: "active" });
    const criticalAlerts = await Investigation.countDocuments({ severity: "critical" }); // keeping same logic as before
    const totalUsers = await User.countDocuments();
    const unreadAlerts = await Alert.countDocuments({ isRead: false });
    const totalSearches = await SearchHistory.countDocuments();

    // Status breakdown
    const statusBreakdown = await Investigation.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } }
    ]);

    // Severity breakdown
    const severityBreakdown = await Investigation.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
      { $project: { severity: "$_id", count: 1, _id: 0 } }
    ]);

    // Target type breakdown
    const targetTypeBreakdown = await Investigation.aggregate([
      { $group: { _id: "$targetType", count: { $sum: 1 } } },
      { $project: { type: "$_id", count: 1, _id: 0 } }
    ]);

    // Recent investigations
    const recentInvestigations = await Investigation.find({}, { title: 1, status: 1, severity: 1, targetType: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .then(docs => docs.map(d => ({ ...d, id: d._id.toString(), _id: undefined })));

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrendData = await Investigation.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { month: { $month: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrend = monthlyTrendData.map(d => ({
      month: monthNames[d._id.month - 1],
      month_num: d._id.month,
      count: d.count
    }));

    return NextResponse.json({
      stats: {
        totalInvestigations,
        activeInvestigations,
        criticalAlerts,
        totalUsers,
        unreadAlerts,
        totalSearches,
      },
      statusBreakdown,
      severityBreakdown,
      targetTypeBreakdown,
      recentInvestigations,
      monthlyTrend,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
