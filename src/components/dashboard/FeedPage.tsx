"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Radar, Wifi, Globe, Shield, AlertTriangle, Clock, Filter, RefreshCw, ExternalLink } from "lucide-react";
import { IFeedItem } from "@/types";

const CATEGORIES = ["All", "APT", "Breach", "Malware", "Vulnerability", "Phishing", "Botnet", "Intel"];

const SEVERITY_STYLES: Record<string, { badge: string; dot: string; bg: string }> = {
  critical: { badge: "badge-critical", dot: "bg-red-400", bg: "border-l-red-500" },
  high: { badge: "badge-high", dot: "bg-orange-400", bg: "border-l-orange-500" },
  medium: { badge: "badge-medium", dot: "bg-yellow-400", bg: "border-l-yellow-500" },
  low: { badge: "badge-low", dot: "bg-green-400", bg: "border-l-green-500" },
};

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<IFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feed");
      const data = await res.json();
      if (data.success) {
        setFeedItems(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const filtered = useMemo(() => {
    return feedItems.filter((item) => category === "All" || item.category === category);
  }, [feedItems, category]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeed();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(min / 60);
    if (min < 60) return `${min}m ago`;
    return `${hr}h ago`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-400 pulse-dot" />
            <Radar className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-mono text-red-400/80 tracking-wider">LIVE INTEL FEED</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Intelligence Feed</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time threat intelligence and global OSINT updates</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono hidden md:block">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1e3a5f]/60 text-slate-400 hover:text-white hover:border-cyan-500/30 transition-all text-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Threats", value: loading ? "-" : feedItems.length, icon: Shield, color: "text-red-400 bg-red-500/10 border-red-500/20" },
          { label: "New CVEs Today", value: loading ? "-" : feedItems.filter(f => f.category === "Vulnerability").length, icon: AlertTriangle, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
          { label: "Sources Online", value: loading ? "-" : "47/50", icon: Globe, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { label: "IOCs Tracked", value: loading ? "-" : feedItems.reduce((acc, curr) => acc + (curr.iocs?.length || 0), 0), icon: Radar, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-white tabular-nums">
                {loading ? <div className="h-6 w-8 bg-[#1e3a5f]/50 rounded animate-pulse" /> : stat.value}
              </div>
              <div className="text-[10px] text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              category === cat
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-slate-500 hover:text-white border border-transparent hover:border-[#1e3a5f]/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed Items */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 border-l-2 border-[#1e3a5f]/50">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-[#1e3a5f]/60 animate-pulse mt-1" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-4 bg-[#1e3a5f]/40 rounded-full animate-pulse" />
                    <div className="w-16 h-4 bg-[#1e3a5f]/40 rounded-full animate-pulse" />
                  </div>
                  <div className="w-3/4 h-4 bg-[#1e3a5f]/30 rounded animate-pulse" />
                  <div className="w-full h-10 bg-[#1e3a5f]/20 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : (
          filtered.map((item) => {
            const style = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.medium;
            return (
              <div key={item._id} className={`glass rounded-xl p-5 border-l-2 ${style.bg} hover:translate-x-0.5 transition-all`}>
                <div className="flex items-start gap-4">
                  {/* Left accent */}
                  <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${style.dot} ${item.severity === "critical" ? "pulse-dot" : ""}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-500 bg-[#0d1b2e] px-2 py-0.5 rounded-full border border-[#1e3a5f]/50">
                          {item.category}
                        </span>
                        <span className={style.badge}>{item.severity?.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-slate-500 font-mono">{item.source}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-[10px] text-slate-500 font-mono">{timeAgo(item.time)}</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-white mt-2 leading-snug">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{item.summary}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags?.map((tag: string) => (
                        <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-[#1e3a5f]/50 text-slate-500 border border-[#2d5a8e]/20">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* IOCs */}
                    {item.iocs?.length > 0 && (
                      <div className="mt-3 p-2.5 rounded-lg bg-[#050b14]/60 border border-[#1e3a5f]/30">
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1.5">Indicators of Compromise (IOCs)</p>
                        <div className="flex flex-wrap gap-2">
                          {item.iocs.map((ioc: string) => (
                            <code key={ioc} className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                              {ioc}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pl-6">
                  <button className="text-[10px] px-3 py-1.5 rounded-lg border border-[#1e3a5f]/60 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Details
                  </button>
                  <button className="text-[10px] px-3 py-1.5 rounded-lg border border-[#1e3a5f]/60 text-slate-500 hover:text-amber-400 hover:border-amber-500/30 transition-all">
                    + Add IOCs to Case
                  </button>
                  <button className="text-[10px] px-3 py-1.5 rounded-lg border border-[#1e3a5f]/60 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                    Create Alert
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
