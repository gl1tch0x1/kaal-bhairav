"use client";
import {
  Target as TargetIcon, User, Globe, Mail, Phone, Building, Hash, Shield,
  Plus, Search, Filter, Eye, Trash2, Crosshair, ChevronRight, X,
  Zap, AlertTriangle, CheckCircle, Clock, ExternalLink, Copy, Database,
  Wifi, Lock, Code2, GitBranch, Server, RefreshCw, Info, RotateCcw
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";

// ── Type helpers ────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  person: User, domain: Globe, ip: Shield,
  email: Mail, phone: Phone, organization: Building, social: User, hash: Hash,
};

const TYPE_COLORS: Record<string, string> = {
  domain:       "text-cyan-400    bg-cyan-500/10    border-cyan-500/30",
  ip:           "text-blue-400    bg-blue-500/10    border-blue-500/30",
  email:        "text-purple-400  bg-purple-500/10  border-purple-500/30",
  phone:        "text-green-400   bg-green-500/10   border-green-500/30",
  person:       "text-amber-400   bg-amber-500/10   border-amber-500/30",
  organization: "text-pink-400    bg-pink-500/10    border-pink-500/30",
  social:       "text-sky-400     bg-sky-500/10     border-sky-500/30",
  hash:         "text-rose-400    bg-rose-500/10    border-rose-500/30",
};

const RISK_COLORS: Record<string, string> = {
  critical: "text-red-400    bg-red-500/10    border-red-500/30",
  high:     "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  low:      "text-green-400  bg-green-500/10  border-green-500/30",
  info:     "text-slate-400  bg-slate-500/10  border-slate-500/30",
};

const RISK_BAR_COLOR: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
  info: "bg-slate-500",
};

const RISK_SCORE_MAX = 100;

// Source badge colors
const SOURCE_COLORS: Record<string, string> = {
  "web-check:dns":       "text-cyan-300    bg-cyan-500/10    border-cyan-500/20",
  "web-check:ssl":       "text-green-300   bg-green-500/10   border-green-500/20",
  "web-check:whois":     "text-blue-300    bg-blue-500/10    border-blue-500/20",
  "web-check:headers":   "text-purple-300  bg-purple-500/10  border-purple-500/20",
  "web-check:ports":     "text-amber-300   bg-amber-500/10   border-amber-500/20",
  "web-check:threats":   "text-red-300     bg-red-500/10     border-red-500/20",
  "web-check:tech-stack":"text-pink-300    bg-pink-500/10    border-pink-500/20",
  "web-check:redirects": "text-orange-300  bg-orange-500/10  border-orange-500/20",
  "web-check:dns-sec":   "text-teal-300    bg-teal-500/10    border-teal-500/20",
  "crt.sh":              "text-teal-300    bg-teal-500/10    border-teal-500/20",
  "Shodan":              "text-yellow-300  bg-yellow-500/10  border-yellow-500/20",
  "VirusTotal":          "text-red-300     bg-red-500/10     border-red-500/20",
  "AbuseIPDB":           "text-rose-300    bg-rose-500/10    border-rose-500/20",
  "AlienVault OTX":      "text-violet-300  bg-violet-500/10  border-violet-500/20",
};

const SOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "web-check:dns": GitBranch,
  "web-check:ssl": Lock,
  "web-check:whois": Info,
  "web-check:headers": Code2,
  "web-check:ports": Server,
  "web-check:threats": AlertTriangle,
  "web-check:tech-stack": Code2,
  "web-check:redirects": GitBranch,
  "crt.sh": Lock,
  "Shodan": Wifi,
  "VirusTotal": Shield,
};

function getRiskPercent(risk: string) {
  return { critical: 95, high: 75, medium: 50, low: 25, info: 5 }[risk] ?? 5;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function RiskGauge({ risk, score }: { risk: string; score?: number }) {
  const pct = score !== undefined ? score : getRiskPercent(risk);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e", info: "#64748b" }[risk] ?? "#64748b";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="#1e3a5f" strokeWidth="8" />
        <circle
          cx="45" cy="45" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="45" y="45" textAnchor="middle" dy="5" fontSize="15" fontWeight="bold" fill="white">{pct}</text>
      </svg>
      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${RISK_COLORS[risk]}`}>
        {risk}
      </span>
    </div>
  );
}

function ResultCard({ result }: { result: any }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const srcColor = SOURCE_COLORS[result.source] || "text-cyan-300 bg-cyan-500/10 border-cyan-500/20";
  const SrcIcon = SOURCE_ICONS[result.source] || Database;

  const copy = () => {
    navigator.clipboard.writeText(result.snippet || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-[#1e3a5f]/50 bg-[#050b14]/60 hover:border-cyan-500/20 transition-all">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-semibold ${srcColor}`}>
              <SrcIcon className="w-2.5 h-2.5" />
              {result.source}
            </div>
            {result.category && (
              <span className="text-[9px] text-slate-600 bg-[#1e3a5f]/30 px-1.5 py-0.5 rounded border border-[#2d5a8e]/20">
                {result.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              result.riskScore >= 75 ? "text-red-400 border-red-500/30 bg-red-500/10" :
              result.riskScore >= 50 ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
              result.riskScore >= 25 ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" :
              "text-green-400 border-green-500/30 bg-green-500/10"
            }`}>{result.riskScore}</span>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-200 mb-1 leading-snug">{result.title}</p>
        <p className="text-[10px] text-slate-500 font-mono leading-relaxed">{result.snippet}</p>

        {result.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {result.tags.map((t: string, i: number) => (
              <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#1e3a5f]/40 text-slate-600 border border-[#2d5a8e]/30">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {result.data && Object.keys(result.data).length > 0 && (
        <div className="border-t border-[#1e3a5f]/40">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-[9px] text-slate-600 hover:text-cyan-400 transition-colors font-mono"
          >
            <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> Raw Intelligence</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
          {expanded && (
            <div className="px-3 pb-3">
              <pre className="text-[8px] font-mono text-slate-500 bg-black/30 rounded-lg p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all border border-[#1e3a5f]/30">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-t border-[#1e3a5f]/30">
        <button onClick={copy} className="flex items-center gap-1 text-[9px] text-slate-600 hover:text-cyan-400 transition-colors">
          {copied ? <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        {result.url && (
          <a href={result.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[9px] text-slate-600 hover:text-cyan-400 transition-colors ml-2">
            <ExternalLink className="w-2.5 h-2.5" /> View Source
          </a>
        )}
      </div>
    </div>
  );
}

function TargetDetailDrawer({ target, onClose, onDelete, onRescan }: {
  target: any;
  onClose: () => void;
  onDelete: (id: string) => void;
  onRescan: (target: any) => void;
}) {
  const meta = target.metadata || {};
  const results: any[] = meta.results || [];
  const [activeTab, setActiveTab] = useState("overview");

  // Unique categories from results
  const categories = Array.from(new Set(results.map((r: any) => r.category || r.source.split(":")[1] || "other")));

  const filteredResults = activeTab === "overview" ? results.slice(0, 8) :
    results.filter((r: any) => (r.category || r.source.split(":")[1] || "other") === activeTab);

  const Icon = TYPE_ICONS[target.type] || TargetIcon;
  const riskColor = RISK_COLORS[target.risk] || RISK_COLORS.info;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-[#060e1a] border-l border-[#1e3a5f]/60 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e3a5f]/40 bg-[#050b14]/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[target.type] || TYPE_COLORS.domain}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">{target.label}</h2>
              <p className="text-[10px] text-slate-500 font-mono truncate">{target.value}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onRescan(target)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all text-xs font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Re-scan
            </button>
            <button
              onClick={() => onDelete(target._id)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Risk + meta overview */}
          <div className="px-6 py-5 border-b border-[#1e3a5f]/30">
            <div className="flex items-start gap-6">
              <RiskGauge risk={target.risk} score={meta.maxRiskScore} />

              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#0a1628]/60 border border-[#1e3a5f]/40 p-3">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Type</p>
                    <p className="text-xs text-white font-semibold capitalize">{target.type}</p>
                  </div>
                  <div className="rounded-xl bg-[#0a1628]/60 border border-[#1e3a5f]/40 p-3">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Risk Level</p>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${riskColor}`}>{target.risk}</span>
                  </div>
                  <div className="rounded-xl bg-[#0a1628]/60 border border-[#1e3a5f]/40 p-3">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Data Points</p>
                    <p className="text-xs text-white font-semibold">{meta.resultCount || results.length || 0}</p>
                  </div>
                  <div className="rounded-xl bg-[#0a1628]/60 border border-[#1e3a5f]/40 p-3">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Sources</p>
                    <p className="text-xs text-white font-semibold">{meta.sources?.length || 0}</p>
                  </div>
                </div>

                {target.notes && (
                  <div className="rounded-xl bg-[#0a1628]/60 border border-[#1e3a5f]/40 p-3">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Intel Notes</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{target.notes}</p>
                  </div>
                )}

                {target.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {target.tags.map((t: string, i: number) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e3a5f]/40 text-slate-500 border border-[#2d5a8e]/30">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active sources badges */}
            {meta.sources?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {meta.sources.map((src: string, i: number) => {
                  const srcColor = SOURCE_COLORS[src] || "text-slate-400 bg-slate-500/10 border-slate-500/20";
                  const SrcIcon = SOURCE_ICONS[src] || Database;
                  return (
                    <span key={i} className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border font-medium ${srcColor}`}>
                      <SrcIcon className="w-2.5 h-2.5" />
                      {src}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Last scanned */}
            <div className="flex items-center gap-1.5 mt-3 text-[9px] text-slate-600 font-mono">
              <Clock className="w-2.5 h-2.5" />
              Last scanned: {meta.scanDate ? new Date(meta.scanDate).toLocaleString() : "Unknown"}
            </div>
          </div>

          {/* No OSINT data state */}
          {results.length === 0 && (
            <div className="px-6 py-10 text-center">
              <Database className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">No OSINT data yet</p>
              <p className="text-slate-600 text-xs mt-1">Click Re-scan to run an OSINT search for this target</p>
            </div>
          )}

          {/* Results section */}
          {results.length > 0 && (
            <div className="px-6 py-4">
              {/* Category tabs */}
              <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                {["overview", ...categories].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-medium whitespace-nowrap border transition-all flex-shrink-0 ${
                      activeTab === tab
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                        : "text-slate-500 border-transparent hover:text-slate-300"
                    }`}
                  >
                    {tab === "overview" ? `ALL (${results.length})` : tab.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredResults.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center py-4">No results in this category</p>
                ) : (
                  filteredResults.map((result: any, i: number) => (
                    <ResultCard key={i} result={result} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1e3a5f]/40 bg-[#050b14]/80 flex items-center gap-2 flex-shrink-0">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <p className="text-[9px] text-slate-600">Intelligence data is for authorized personnel only. Handle per classification policy.</p>
        </div>
      </div>
    </>
  );
}

// ── Add Target Modal ─────────────────────────────────────────────────────────

function AddTargetModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: any) => void }) {
  const [form, setForm] = useState({ type: "domain", value: "", label: "", risk: "info", notes: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.value.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, label: form.label || form.value }),
      });
      const data = await res.json();
      if (data.success) {
        onAdd(data.data);
        onClose();
      }
    } catch {}
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-6 w-full max-w-md border border-[#2d5a8e]/40 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold text-base">Add New Target</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full input-dark px-3 py-2 rounded-xl text-sm"
                >
                  {["domain","ip","email","phone","person","organization","social","hash"].map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Risk Level</label>
                <select
                  value={form.risk}
                  onChange={e => setForm(f => ({ ...f, risk: e.target.value }))}
                  className="w-full input-dark px-3 py-2 rounded-xl text-sm"
                >
                  {["info","low","medium","high","critical"].map(r => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Value *</label>
              <input
                type="text"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="e.g. example.com, 192.168.1.1"
                className="w-full input-dark px-3 py-2.5 rounded-xl text-sm font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Label (optional)</label>
              <input
                type="text"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Human-friendly name"
                className="w-full input-dark px-3 py-2.5 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Intelligence notes..."
                rows={2}
                className="w-full input-dark px-3 py-2.5 rounded-xl text-sm resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#1e3a5f]/60 text-slate-400 hover:text-white text-sm transition-all">
                Cancel
              </button>
              <button type="submit" disabled={loading || !form.value.trim()}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {loading ? "Adding..." : "Add Target"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function TargetsPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState<string | null>(null);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/targets");
      const data = await res.json();
      if (data.success) setTargets(data.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTargets();
  }, [fetchTargets]);

  const filtered = useMemo(() =>
    targets.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.label?.toLowerCase().includes(q) || t.value?.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q);
      const matchType = !filterType || t.type === filterType;
      const matchRisk  = !filterRisk  || t.risk  === filterRisk;
      return matchSearch && matchType && matchRisk;
    }),
    [targets, search, filterType, filterRisk]
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/targets?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTargets(prev => prev.filter(t => t._id !== id));
        if (selectedTarget?._id === id) setSelectedTarget(null);
      }
    } catch {}
    setDeletingId(null);
  };

  const handleRescan = async (target: any) => {
    setRescanning(target._id);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: target.value, queryType: target.type }),
      });
      if (res.ok) {
        // Refresh target data
        setTimeout(async () => {
          await fetchTargets();
          // Refresh selected target detail
          const refreshed = await fetch(`/api/targets?id=${target._id}`);
          const d = await refreshed.json();
          if (d.success) setSelectedTarget(d.data);
        }, 1000);
      }
    } catch {}
    setRescanning(null);
  };

  const statCards = [
    { label: "Total Targets",  value: targets.length,                                          color: "text-cyan-400    bg-cyan-500/10    border-cyan-500/20",    icon: TargetIcon },
    { label: "Critical Risk",  value: targets.filter(t => t.risk === "critical").length,        color: "text-red-400     bg-red-500/10     border-red-500/20",      icon: AlertTriangle },
    { label: "High Risk",      value: targets.filter(t => t.risk === "high").length,            color: "text-orange-400  bg-orange-500/10  border-orange-500/20",   icon: Zap },
    { label: "With OSINT Data",value: targets.filter(t => t.metadata?.resultCount > 0).length,  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",  icon: CheckCircle },
  ];

  const uniqueTypes = Array.from(new Set(targets.map(t => t.type)));

  return (
    <div className="space-y-5">
      {/* Modals */}
      {showAddModal && (
        <AddTargetModal
          onClose={() => setShowAddModal(false)}
          onAdd={t => { setTargets(prev => [t, ...prev]); }}
        />
      )}
      {selectedTarget && (
        <TargetDetailDrawer
          target={selectedTarget}
          onClose={() => setSelectedTarget(null)}
          onDelete={async (id) => { await handleDelete(id); }}
          onRescan={handleRescan}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-mono text-red-400/80 tracking-wider">TARGET TRACKING</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Target Analysis</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Track intelligence targets — OSINT data auto-populated from searches
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Target
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                {loading ? <div className="h-6 w-10 bg-[#1e3a5f]/50 rounded animate-pulse" /> : s.value}
              </div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search targets..."
            className="w-full input-dark pl-9 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 flex-wrap">
          {["", ...uniqueTypes].map(t => (
            <button
              key={t || "all"}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-medium capitalize border transition-all ${
                filterType === t
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                  : "text-slate-500 border-transparent hover:text-slate-300"
              }`}
            >
              {t || "All Types"}
            </button>
          ))}
        </div>

        {/* Risk filter */}
        <select
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value)}
          className="input-dark py-2 px-3 rounded-xl text-xs border border-[#1e3a5f]/60 text-slate-400"
        >
          <option value="">All Risks</option>
          {["critical","high","medium","low","info"].map(r => (
            <option key={r} value={r} className="capitalize">{r}</option>
          ))}
        </select>
      </div>

      {/* Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a5f]/30 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-[#1e3a5f]/40 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-[#1e3a5f]/20 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-[#1e3a5f]/20 rounded animate-pulse" />
                <div className="h-2 w-3/4 bg-[#1e3a5f]/20 rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-3 glass rounded-xl p-12 text-center">
            <Crosshair className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No targets found</p>
            {targets.length === 0 ? (
              <p className="text-slate-600 text-sm mt-1">
                Targets are auto-added when you run an OSINT search, or add one manually.
              </p>
            ) : (
              <p className="text-slate-600 text-sm mt-1">Try adjusting your filters</p>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 btn-primary px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add Target
            </button>
          </div>
        ) : (
          filtered.map(target => {
            const Icon = TYPE_ICONS[target.type] || TargetIcon;
            const typeColor = TYPE_COLORS[target.type] || TYPE_COLORS.domain;
            const riskColor = RISK_COLORS[target.risk] || RISK_COLORS.info;
            const hasOsint = (target.metadata?.resultCount || 0) > 0;
            const maxRisk = target.metadata?.maxRiskScore || 0;
            const pct = maxRisk;

            return (
              <div
                key={target._id}
                onClick={() => setSelectedTarget(target)}
                className="glass rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all cursor-pointer group relative"
              >
                {/* Risk bar at top */}
                <div className="h-0.5 bg-[#1e3a5f]/40">
                  <div
                    className={`h-full transition-all ${RISK_BAR_COLOR[target.risk] || "bg-slate-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="p-4">
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">{target.label}</h4>
                        <p className="text-[10px] text-slate-500 capitalize">{target.type}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold flex-shrink-0 ${riskColor}`}>
                      {target.risk?.toUpperCase()}
                    </span>
                  </div>

                  {/* Value */}
                  <div className="mb-3">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">Identifier</p>
                    <p className="text-xs font-mono text-cyan-300 break-all">{target.value}</p>
                  </div>

                  {/* OSINT data indicator */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#1e3a5f]/30">
                    <div className="flex items-center gap-2">
                      {hasOsint ? (
                        <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                          <CheckCircle className="w-2.5 h-2.5" />
                          {target.metadata.resultCount} data points
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] text-slate-600 bg-[#1e3a5f]/20 border border-[#2d5a8e]/20 px-1.5 py-0.5 rounded-full">
                          <Database className="w-2.5 h-2.5" />
                          No OSINT data
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); handleRescan(target); }}
                        disabled={rescanning === target._id}
                        className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-slate-600 hover:text-cyan-400 transition-all"
                        title="Re-scan"
                      >
                        <RefreshCw className={`w-3 h-3 ${rescanning === target._id ? "animate-spin text-cyan-400" : ""}`} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(target._id); }}
                        disabled={deletingId === target._id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-cyan-400 transition-colors ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && targets.length > 0 && (
        <p className="text-center text-[10px] text-slate-600 font-mono">
          {filtered.length} of {targets.length} targets · Click any card to view full OSINT intelligence
        </p>
      )}
    </div>
  );
}
