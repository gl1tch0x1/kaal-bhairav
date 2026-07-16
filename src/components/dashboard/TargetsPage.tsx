"use client";
import {
  Target, User, Globe, Mail, Phone, Building, Hash,
  Plus, Search, Filter, Shield, Crosshair, Eye, Trash2
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  person: User,
  domain: Globe,
  ip: Shield,
  email: Mail,
  phone: Phone,
  organization: Building,
  hash: Hash,
  social: User,
};

const RISK_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  low: "text-green-400 bg-green-500/10 border-green-500/30",
};

export default function TargetsPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    fetch("/api/targets")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTargets(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return targets.filter((t) => {
      const matchSearch = !search || t.label.toLowerCase().includes(search.toLowerCase()) || t.value.toLowerCase().includes(search.toLowerCase());
      const matchType = !selectedType || t.type === selectedType;
      return matchSearch && matchType;
    });
  }, [targets, search, selectedType]);

  const uniqueTypes = useMemo(() => new Set(targets.map(t => t.type)).size, [targets]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-mono text-red-400/80 tracking-wider">TARGET TRACKING</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Target Analysis</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track and analyze intelligence targets</p>
        </div>
        <button className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Target
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Targets", value: loading ? "-" : targets.length, icon: Target, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
          { label: "Critical Risk", value: loading ? "-" : targets.filter(t => t.risk === "critical").length, icon: Shield, color: "text-red-400 bg-red-500/10 border-red-500/20" },
          { label: "High Risk", value: loading ? "-" : targets.filter(t => t.risk === "high").length, icon: Eye, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
          { label: "Types Tracked", value: loading ? "-" : uniqueTypes, icon: Filter, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                {loading ? <div className="h-6 w-12 bg-[#1e3a5f]/50 rounded animate-pulse" /> : stat.value}
              </div>
              <div className="text-[10px] text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search targets..."
            className="w-full input-dark pl-10 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["", "person", "domain", "ip", "email", "phone", "organization"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                selectedType === type
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-500 hover:text-white border border-transparent hover:border-[#1e3a5f]/60"
              }`}
            >
              {type || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          /* Skeletons */
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden p-4">
              <div className="flex items-start justify-between border-b border-[#1e3a5f]/40 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1e3a5f]/30 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-[#1e3a5f]/40 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-[#1e3a5f]/20 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-3 w-full bg-[#1e3a5f]/20 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-[#1e3a5f]/20 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-[#1e3a5f]/20 rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : (
          filtered.map((target) => {
            const Icon = TYPE_ICONS[target.type] || Target;
            return (
              <div key={target._id} className="glass rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all group cursor-pointer">
                {/* Card Header */}
                <div className="p-4 border-b border-[#1e3a5f]/40">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/60 flex items-center justify-center group-hover:border-cyan-500/30 transition-all">
                        <Icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{target.label}</h4>
                        <p className="text-[10px] text-slate-500 capitalize">{target.type}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${RISK_COLORS[target.risk] || RISK_COLORS.low}`}>
                      {target.risk?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Identifier</p>
                    <p className="text-xs font-mono text-cyan-300 break-all">{target.value}</p>
                  </div>
                  {target.notes && (
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Intel Notes</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{target.notes}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {target.tags?.map((tag: string) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e3a5f]/60 text-slate-500 border border-[#2d5a8e]/30">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#1e3a5f]/30">
                    <span className="text-[9px] text-slate-600 font-mono">
                      Last seen: {target.lastSeen ? new Date(target.lastSeen).toLocaleDateString() : 'Unknown'}
                    </span>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-slate-500 hover:text-cyan-400 transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
