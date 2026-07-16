"use client";
import { useState, useEffect } from "react";
import {
  FolderOpen, Target, AlertTriangle, Users, Search,
  TrendingUp, Activity, Clock, Shield, Zap, Eye,
  Globe, ChevronRight, ArrowUpRight, BarChart3
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { timeAgo, getSeverityColor, getStatusColor } from "@/lib/utils";

interface Stats {
  totalInvestigations: number;
  activeInvestigations: number;
  criticalAlerts: number;
  totalUsers: number;
  unreadAlerts: number;
  totalSearches: number;
}

interface Investigation {
  id: number;
  title: string;
  status: string;
  severity: string;
  targetType: string;
  createdAt: string;
}

interface StatsData {
  stats: Stats;
  statusBreakdown: Array<{ status: string; count: number }>;
  severityBreakdown: Array<{ severity: string; count: number }>;
  targetTypeBreakdown: Array<{ type: string; count: number }>;
  recentInvestigations: Investigation[];
  monthlyTrend: Array<{ month: string; count: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  pending: "#f59e0b",
  closed: "#64748b",
  archived: "#8b5cf6",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  info: "#3b82f6",
};

const THREAT_FEED = [
  { type: "IP Flagged", value: "185.220.101.47", threat: "Tor Exit Node", severity: "high", time: "2m ago" },
  { type: "Domain", value: "malware-c2.xyz", threat: "C2 Server", severity: "critical", time: "5m ago" },
  { type: "Email", value: "phish@evil.com", threat: "Phishing Campaign", severity: "high", time: "12m ago" },
  { type: "Hash", value: "a4f2bc...3d91", threat: "Ransomware Binary", severity: "critical", time: "18m ago" },
  { type: "IP Flagged", value: "103.21.244.0", threat: "Botnet Node", severity: "medium", time: "31m ago" },
];

const MOCK_MONTHLY = [
  { month: "Jul", count: 4 },
  { month: "Aug", count: 7 },
  { month: "Sep", count: 5 },
  { month: "Oct", count: 11 },
  { month: "Nov", count: 9 },
  { month: "Dec", count: 14 },
];

export default function DashboardHome() {
  const [data, setData] = useState<StatsData | null>(null);
  const [feedData, setFeedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((statsRes) => {
        setData(statsRes);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Connect to live SSE feed stream
    const sse = new EventSource("/api/feed/stream");
    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.feed) {
          setFeedData(payload.feed.slice(0, 5));
        }
      } catch (err) {}
    };

    return () => sse.close();
  }, []);

  const stats = data?.stats;
  const monthlyData = data?.monthlyTrend?.length ? data.monthlyTrend.map((m) => ({ month: m.month, count: Number(m.count) })) : MOCK_MONTHLY;

  const statCards = [
    {
      label: "Total Investigations",
      value: stats?.totalInvestigations ?? 0,
      icon: FolderOpen,
      color: "from-cyan-600/20 to-cyan-800/10",
      border: "border-cyan-500/20",
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/10",
      change: "+12%",
      changeUp: true,
    },
    {
      label: "Active Cases",
      value: stats?.activeInvestigations ?? 0,
      icon: Target,
      color: "from-emerald-600/20 to-emerald-800/10",
      border: "border-emerald-500/20",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      change: "+3 today",
      changeUp: true,
    },
    {
      label: "Critical Threats",
      value: stats?.criticalAlerts ?? 0,
      icon: AlertTriangle,
      color: "from-red-600/20 to-red-800/10",
      border: "border-red-500/20",
      iconColor: "text-red-400",
      iconBg: "bg-red-500/10",
      change: "Needs attention",
      changeUp: false,
    },
    {
      label: "Unread Alerts",
      value: stats?.unreadAlerts ?? 0,
      icon: Zap,
      color: "from-amber-600/20 to-amber-800/10",
      border: "border-amber-500/20",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
      change: "New since login",
      changeUp: false,
    },
    {
      label: "Total Analysts",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "from-purple-600/20 to-purple-800/10",
      border: "border-purple-500/20",
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10",
      change: "Team online",
      changeUp: true,
    },
    {
      label: "Total Searches",
      value: stats?.totalSearches ?? 0,
      icon: Search,
      color: "from-blue-600/20 to-blue-800/10",
      border: "border-blue-500/20",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      change: "Queries run",
      changeUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-mono">INITIALIZING INTELLIGENCE CORE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-[10px] font-mono text-emerald-400/80 tracking-wider">LIVE DASHBOARD</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Intelligence Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time OSINT monitoring and threat analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400">THREAT LEVEL: HIGH</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`stat-card rounded-xl p-4 bg-gradient-to-br ${card.color} border ${card.border} relative overflow-hidden group cursor-pointer`}
          >
            <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20 bg-gradient-to-bl from-white/10 to-transparent" />
            <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-4 h-4 ${card.iconColor}`} />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">{card.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{card.label}</div>
            <div className={`text-[9px] mt-1.5 font-medium ${card.changeUp ? "text-emerald-400" : "text-amber-400"}`}>
              {card.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly trend chart */}
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white text-sm">Investigation Timeline</h3>
              <p className="text-slate-500 text-xs mt-0.5">Monthly case activity over 6 months</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-cyan-400 font-medium">+24% growth</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.4)" />
              <XAxis dataKey="month" tick={{ fill: "#4a6d8c", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4a6d8c", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "8px", color: "#e8f4fd", fontSize: "12px" }}
                cursor={{ stroke: "rgba(8,145,178,0.3)" }}
              />
              <Area type="monotone" dataKey="count" stroke="#0891b2" strokeWidth={2} fill="url(#cyanGrad)" dot={{ fill: "#0891b2", r: 3 }} activeDot={{ r: 5, fill: "#22d3ee" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown pie */}
        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-white text-sm">Case Status</h3>
            <p className="text-slate-500 text-xs mt-0.5">Distribution by status</p>
          </div>
          {data?.statusBreakdown && data.statusBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data.statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="count">
                    {data.statusBreakdown.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.status] || "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "8px", color: "#e8f4fd", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {data.statusBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] || "#64748b" }} />
                      <span className="text-slate-400 capitalize">{item.status}</span>
                    </div>
                    <span className="text-white font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-slate-600 text-xs text-center">No data yet.<br />Create investigations to see stats.</p>
            </div>
          )}
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Severity Bar Chart */}
        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-white text-sm">Threat Severity</h3>
            <p className="text-slate-500 text-xs mt-0.5">Cases by severity level</p>
          </div>
          {data?.severityBreakdown && data.severityBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.severityBreakdown} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.4)" />
                <XAxis dataKey="severity" tick={{ fill: "#4a6d8c", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4a6d8c", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "8px", color: "#e8f4fd", fontSize: "11px" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.severityBreakdown.map((entry, index) => (
                    <Cell key={index} fill={SEVERITY_COLORS[entry.severity] || "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[160px] flex items-center justify-center">
              <p className="text-slate-600 text-xs text-center">No severity data yet.</p>
            </div>
          )}
        </div>

        {/* Live Threat Feed */}
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 pulse-dot" />
                Live Threat Intelligence Feed
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Real-time IOC monitoring</p>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-full">LIVE</span>
          </div>
          <div className="space-y-2">
            {feedData.length > 0 ? feedData.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#050b14]/60 border border-[#1e3a5f]/40 hover:border-[#2d5a8e]/60 transition-all group"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  item.severity === "critical" ? "bg-red-400" :
                  item.severity === "high" ? "bg-orange-400" : "bg-yellow-400"
                } ${item.severity === "critical" ? "pulse-dot" : ""}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{item.category}</span>
                    <span className="font-mono text-xs text-cyan-300">{item.iocs?.[0] || item.source}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{item.title}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge-${item.severity}`}>{item.severity.toUpperCase()}</span>
                  <span className="text-[10px] text-slate-600 font-mono">{timeAgo(item.time)}</span>
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-full min-h-[150px]">
                <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Investigations + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Investigations */}
        <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]/40">
            <h3 className="font-semibold text-white text-sm">Recent Investigations</h3>
            <a href="/dashboard/investigations" className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-[#1e3a5f]/30">
            {data?.recentInvestigations && data.recentInvestigations.length > 0 ? (
              data.recentInvestigations.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors table-row-hover">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    inv.status === "active" ? "bg-emerald-400" :
                    inv.status === "pending" ? "bg-yellow-400" : "bg-slate-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{inv.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{inv.targetType} · {timeAgo(inv.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge-${inv.severity}`}>{inv.severity}</span>
                    <span className={`badge-${inv.status}`}>{inv.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <FolderOpen className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-600 text-sm">No investigations yet</p>
                <a href="/dashboard/investigations" className="text-xs text-cyan-500 mt-1 inline-block">Create one →</a>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & System Status */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "New Investigation", href: "/dashboard/investigations", icon: FolderOpen, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
                { label: "OSINT Lookup", href: "/dashboard/search", icon: Search, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                { label: "View Alerts", href: "/dashboard/alerts", icon: Zap, color: "text-red-400 bg-red-500/10 border-red-500/20" },
                { label: "Activity Log", href: "/dashboard/activity", icon: Activity, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
              ].map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all hover:brightness-110 ${action.color}`}
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                  <ArrowUpRight className="w-3 h-3 ml-auto" />
                </a>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-3">System Status</h3>
            <div className="space-y-2.5">
              {[
                { label: "Database", status: "online", val: "99.9%" },
                { label: "OSINT APIs", status: "online", val: "14/16" },
                { label: "Threat Feed", status: "online", val: "LIVE" },
                { label: "Encryption", status: "online", val: "AES-256" },
                { label: "VPN Tunnel", status: "warning", val: "DEGRADED" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.status === "online" ? "bg-emerald-400" : "bg-amber-400"} ${s.status === "online" ? "" : "pulse-dot"}`} />
                    <span className="text-slate-400">{s.label}</span>
                  </div>
                  <span className={`font-mono ${s.status === "online" ? "text-emerald-400" : "text-amber-400"}`}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
