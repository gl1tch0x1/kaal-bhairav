"use client";
import { useState, useEffect } from "react";
import { FileText, Download, Eye, Plus, Calendar, Shield, TrendingUp, Clock } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low: "text-green-400 bg-green-500/10 border-green-500/20",
};

const TYPE_COLORS: Record<string, string> = {
  "Threat Intelligence": "text-cyan-400",
  "Quarterly Report": "text-purple-400",
  "Breach Analysis": "text-orange-400",
  "Technical Analysis": "text-blue-400",
  "Incident Report": "text-emerald-400",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReports(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-teal-400" />
            <span className="text-[10px] font-mono text-teal-400/80 tracking-wider">INTELLIGENCE REPORTS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Generate and manage intelligence reports</p>
        </div>
        <button className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Reports", value: loading ? "-" : reports.length, icon: FileText, color: "text-cyan-400" },
          { label: "Published", value: loading ? "-" : reports.filter(r => r.status === "published").length, icon: Shield, color: "text-emerald-400" },
          { label: "In Draft", value: loading ? "-" : reports.filter(r => r.status === "draft").length, icon: Clock, color: "text-amber-400" },
          { label: "This Month", value: loading ? "-" : reports.length, icon: TrendingUp, color: "text-purple-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <div className="text-xl font-bold text-white">
                {loading ? <div className="h-6 w-8 bg-[#1e3a5f]/50 rounded animate-pulse" /> : stat.value}
              </div>
              <div className="text-[10px] text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-14 rounded-xl bg-[#1e3a5f]/30 flex-shrink-0 animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-4 bg-[#1e3a5f]/40 rounded-full animate-pulse" />
                    <div className="w-24 h-4 bg-[#1e3a5f]/40 rounded-full animate-pulse" />
                  </div>
                  <div className="w-3/4 h-4 bg-[#1e3a5f]/30 rounded animate-pulse" />
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1e3a5f]/30">
                    <div className="w-20 h-3 bg-[#1e3a5f]/20 rounded animate-pulse" />
                    <div className="w-20 h-3 bg-[#1e3a5f]/20 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          reports.map((report) => (
            <div key={report._id} className="glass rounded-xl p-5 hover:border-cyan-500/20 transition-all">
              <div className="flex items-start gap-4">
                {/* Report Icon */}
                <div className="w-12 h-14 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/60 flex flex-col items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-cyan-500/60" />
                  <span className="text-[8px] text-slate-600 mt-1">{report.pages}p</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-medium ${TYPE_COLORS[report.type] || "text-slate-400"}`}>
                          {report.type}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${SEVERITY_COLORS[report.severity] || SEVERITY_COLORS.low}`}>
                          {report.severity?.toUpperCase()}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          report.status === "published"
                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                            : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                        }`}>
                          {report.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">{report.title}</h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-2xl">{report.description}</p>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1e3a5f]/30 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] text-slate-500">{new Date(report.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] text-slate-500">{report.author}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e3a5f]/60 text-xs text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e3a5f]/60 text-xs text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                        <Download className="w-3 h-3" />
                        Export PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
