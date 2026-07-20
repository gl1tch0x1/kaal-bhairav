"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Database, CheckCircle, XCircle, Clock, Wifi, RefreshCw,
  ExternalLink, Search, AlertTriangle
} from "lucide-react";

const STATUS_CONFIG = {
  online:  { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", dot: "bg-emerald-400", label: "ONLINE" },
  warning: { icon: AlertTriangle, color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/30",  dot: "bg-amber-400",  label: "DEGRADED" },
  offline: { icon: XCircle,      color: "text-red-400",    bg: "bg-red-400/10 border-red-400/30",       dot: "bg-red-400",   label: "OFFLINE" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Network:    "text-cyan-400    bg-cyan-500/10    border-cyan-500/20",
  Malware:    "text-red-400     bg-red-500/10     border-red-500/20",
  Breach:     "text-orange-400  bg-orange-500/10  border-orange-500/20",
  GeoIP:      "text-blue-400    bg-blue-500/10    border-blue-500/20",
  Email:      "text-purple-400  bg-purple-500/10  border-purple-500/20",
  URL:        "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  OSINT:      "text-amber-400   bg-amber-500/10   border-amber-500/20",
  Domain:     "text-slate-300   bg-slate-500/10   border-slate-500/20",
  Graph:      "text-pink-400    bg-pink-500/10    border-pink-500/20",
  DarkWeb:    "text-slate-400   bg-slate-700/30   border-slate-600/30",
  Social:     "text-blue-300    bg-blue-500/10    border-blue-500/20",
  Reputation: "text-yellow-400  bg-yellow-500/10  border-yellow-500/20",
  Paste:      "text-teal-400    bg-teal-500/10    border-teal-500/20",
};

interface Source {
  _id: string;
  name: string;
  category: string;
  status: "online" | "warning" | "offline";
  latency: string;
  lastChecked: string;
  description: string;
  icon: string;
  docs: string;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSources = useCallback(async (forceReseed = false) => {
    try {
      const res = forceReseed
        ? await fetch("/api/sources", { method: "POST" })
        : await fetch("/api/sources");
      const data = await res.json();
      if (data.success) setSources(data.data);
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
    online:  sources.filter(s => s.status === "online").length,
    warning: sources.filter(s => s.status === "warning").length,
    offline: sources.filter(s => s.status === "offline").length,
  }), [sources]);

  const categories = useMemo(() =>
    Array.from(new Set(sources.map(s => s.category))).sort()
  , [sources]);

  const filteredSources = useMemo(() =>
    sources.filter(s => {
      const matchStatus   = filterStatus === "all"   || s.status === filterStatus;
      const matchCategory = filterCategory === "all" || s.category === filterCategory;
      const matchSearch   = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())
                         || s.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchCategory && matchSearch;
    })
  , [sources, filterStatus, filterCategory, searchTerm]);

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
          Refresh Status
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Online",   count: online,  total: sources.length, config: STATUS_CONFIG.online },
          { label: "Degraded", count: warning, total: sources.length, config: STATUS_CONFIG.warning },
          { label: "Offline",  count: offline, total: sources.length, config: STATUS_CONFIG.offline },
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

      {/* Filters */}
      {!loading && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Filter sources..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full input-dark pl-9 pr-4 py-2 rounded-xl text-xs"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5">
            {["all", "online", "warning", "offline"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all capitalize ${
                  filterStatus === s
                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                    : "border-[#1e3a5f]/40 text-slate-500 hover:text-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input-dark py-1.5 px-3 rounded-lg text-xs border border-[#1e3a5f]/60 text-slate-400"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1e3a5f]/30 rounded-xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-[#1e3a5f]/40 rounded animate-pulse" />
                    <div className="w-14 h-3 bg-[#1e3a5f]/20 rounded animate-pulse" />
                  </div>
                </div>
                <div className="w-16 h-4 bg-[#1e3a5f]/30 rounded animate-pulse" />
              </div>
              <div className="space-y-2 mb-3">
                <div className="w-full h-2 bg-[#1e3a5f]/20 rounded animate-pulse" />
                <div className="w-3/4 h-2 bg-[#1e3a5f]/20 rounded animate-pulse" />
              </div>
              <div className="pt-2 border-t border-[#1e3a5f]/30 flex justify-between">
                <div className="w-20 h-3 bg-[#1e3a5f]/20 rounded animate-pulse" />
                <div className="w-10 h-3 bg-[#1e3a5f]/20 rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : filteredSources.length === 0 ? (
          <div className="col-span-3 glass rounded-xl p-10 text-center">
            <Database className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No sources match your filter</p>
            <p className="text-slate-600 text-sm mt-1">Try adjusting filters or clearing search</p>
          </div>
        ) : (
          filteredSources.map((source) => {
            const statusConfig = STATUS_CONFIG[source.status] || STATUS_CONFIG.offline;
            const catColor = CATEGORY_COLORS[source.category] || "text-slate-400 bg-slate-500/10 border-slate-500/20";
            return (
              <div
                key={source._id}
                className={`glass rounded-xl p-4 hover:border-cyan-500/20 transition-all group ${
                  source.status === "offline" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/40">
                      {source.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{source.name}</h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium mt-0.5 inline-block ${catColor}`}>
                        {source.category}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${statusConfig.bg}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${source.status === "online" ? "pulse-dot" : ""}`} />
                    <span className={`text-[9px] font-semibold font-mono ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{source.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#1e3a5f]/30">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Wifi className="w-2.5 h-2.5 text-slate-600" />
                      <span className={`text-[9px] font-mono ${
                        source.status === "online" ? "text-emerald-400/80" : "text-slate-500"
                      }`}>{source.latency}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-600" />
                      <span className="text-[9px] text-slate-600">just now</span>
                    </div>
                  </div>
                  <a
                    href={source.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg bg-[#0d1b2e] border border-[#1e3a5f]/60 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Docs
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Total count */}
      {!loading && sources.length > 0 && (
        <div className="text-center text-[10px] text-slate-600 font-mono">
          {filteredSources.length} of {sources.length} data sources shown
        </div>
      )}
    </div>
  );
}
