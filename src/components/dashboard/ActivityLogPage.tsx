"use client";
import { useState, useEffect } from "react";
import { Activity, Loader2, Clock, User, Database, LogIn, Plus, Eye } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface LogEntry {
  id: number;
  action: string;
  resource: string | null;
  resourceId: number | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  username: string | null;
  fullName: string | null;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LOGIN: LogIn,
  CREATE_INVESTIGATION: Plus,
  VIEW: Eye,
  UPDATE: Database,
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  CREATE_INVESTIGATION: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  VIEW: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  UPDATE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const formatAction = (action: string) =>
    action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-mono text-purple-400/80 tracking-wider">AUDIT TRAIL</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <p className="text-slate-500 text-sm mt-0.5">Complete audit trail of platform activities</p>
      </div>

      {/* Log entries */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No activity recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e3a5f]/30">
            {logs.map((log, index) => {
              const Icon = ACTION_ICONS[log.action] || Activity;
              const colorClass = ACTION_COLORS[log.action] || "text-slate-400 bg-slate-500/10 border-slate-500/20";
              const isFirst = index === 0;
              return (
                <div key={log.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-all ${isFirst ? "bg-cyan-500/[0.02]" : ""}`}>
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{formatAction(log.action)}</span>
                      {log.resource && (
                        <span className="text-xs text-slate-500 bg-[#0d1b2e] px-2 py-0.5 rounded-full border border-[#1e3a5f]/50">
                          {log.resource}
                        </span>
                      )}
                      {isFirst && (
                        <span className="text-[9px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full">
                          LATEST
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-600" />
                        <span className="text-xs text-slate-400">{log.fullName || log.username || "System"}</span>
                      </div>
                      {log.ipAddress && log.ipAddress !== "unknown" && (
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-slate-600" />
                          <span className="text-xs text-slate-500 font-mono">{log.ipAddress}</span>
                        </div>
                      )}
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-1.5 px-2 py-1 rounded bg-[#050b14]/60 border border-[#1e3a5f]/30">
                        <p className="text-[10px] font-mono text-slate-500">
                          {JSON.stringify(log.details)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span className="text-[10px] text-slate-500 font-mono">{timeAgo(log.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
