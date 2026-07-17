"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Database, CheckCircle, XCircle, Clock, Globe, Shield, Wifi, RefreshCw } from "lucide-react";

const STATUS_CONFIG = {
  online: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", dot: "bg-emerald-400" },
  warning: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30", dot: "bg-amber-400" },
  offline: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", dot: "bg-red-400" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Network: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  Malware: "text-red-400 bg-red-500/10 border-red-500/20",
  Breach: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  GeoIP: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Email: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  URL: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  OSINT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Domain: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  Graph: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  DarkWeb: "text-slate-400 bg-slate-700/30 border-slate-600/30",
  Social: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Reputation: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Paste: "text-teal-400 bg-teal-500/10 border-teal-500/20",
};

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();
      if (data.success) {
        setSources(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSources();
  }, [fetchSources]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSources();
  };

  const { online, warning, offline } = useMemo(() => ({
    online: sources.filter(s => s.status === "online").length,
    warning: sources.filter(s => s.status === "warning").length,
    offline: sources.filter(s => s.status === "offline").length,
  }), [sources]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-mono text-blue-400/80 tracking-wider">DATA SOURCES</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Intelligence Sources</h1>
          <p className="text-slate-500 text-sm mt-0.5">Connected OSINT data feeds and API integrations</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1e3a5f]/60 text-slate-400 hover:text-white transition-all text-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          Check All
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Online", count: loading ? "-" : online, total: loading ? "-" : sources.length, config: STATUS_CONFIG.online },
          { label: "Degraded", count: loading ? "-" : warning, total: loading ? "-" : sources.length, config: STATUS_CONFIG.warning },
          { label: "Offline", count: loading ? "-" : offline, total: loading ? "-" : sources.length, config: STATUS_CONFIG.offline },
        ].map((item) => (
          <div key={item.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${item.config.bg}`}>
              <item.config.icon className={`w-4 h-4 ${item.config.color}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                {loading ? <div className="h-6 w-12 bg-[#1e3a5f]/50 rounded animate-pulse" /> : (
                  <>{item.count}<span className="text-slate-600 text-sm font-normal">/{item.total}</span></>
                )}
              </div>
              <div className="text-[10px] text-slate-500">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1e3a5f]/30 rounded-xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="w-20 h-4 bg-[#1e3a5f]/40 rounded animate-pulse" />
                    <div className="w-12 h-3 bg-[#1e3a5f]/20 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="w-full h-2 bg-[#1e3a5f]/20 rounded animate-pulse" />
                <div className="w-3/4 h-2 bg-[#1e3a5f]/20 rounded animate-pulse" />
              </div>
              <div className="pt-2 border-t border-[#1e3a5f]/30 flex justify-between">
                <div className="w-16 h-3 bg-[#1e3a5f]/20 rounded animate-pulse" />
                <div className="w-10 h-3 bg-[#1e3a5f]/20 rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : (
          sources.map((source) => {
            const statusConfig = STATUS_CONFIG[source.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.offline;
            const catColor = CATEGORY_COLORS[source.category] || "text-slate-400 bg-slate-500/10 border-slate-500/20";
            return (
              <div key={source._id} className="glass rounded-xl p-4 hover:border-cyan-500/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl leading-none">{source.icon}</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{source.name}</h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium mt-0.5 inline-block ${catColor}`}>
                        {source.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${source.status === "online" ? "pulse-dot" : ""}`} />
                    <span className={`text-[10px] font-semibold ${statusConfig.color}`}>
                      {source.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{source.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#1e3a5f]/30">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Wifi className="w-2.5 h-2.5 text-slate-600" />
                      <span className="text-[9px] font-mono text-slate-500">{source.latency}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-600" />
                      <span className="text-[9px] text-slate-600">{source.lastChecked}</span>
                    </div>
                  </div>
                  <a
                    href={source.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] px-2 py-1 rounded-lg bg-[#0d1b2e] border border-[#1e3a5f]/60 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                  >
                    Docs
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
