"use client";
import { useState, useEffect } from "react";
import {
  Search, Globe, Mail, Phone, Hash, User, Building,
  Loader2, CheckCircle, AlertCircle, ChevronDown, Clock,
  Copy, ExternalLink, Zap, Shield, Database, TrendingUp,
  ChevronRight, RefreshCw, Info, Eye
} from "lucide-react";
import { timeAgo } from "@/lib/utils";

const SEARCH_TYPES = [
  { value: "general", label: "General", icon: Globe, placeholder: "Search anything..." },
  { value: "domain", label: "Domain/URL", icon: Globe, placeholder: "example.com" },
  { value: "ip", label: "IP Address", icon: Shield, placeholder: "192.168.1.1" },
  { value: "email", label: "Email", icon: Mail, placeholder: "target@domain.com" },
  { value: "phone", label: "Phone", icon: Phone, placeholder: "+91 98765 43210" },
  { value: "username", label: "Username", icon: User, placeholder: "@username" },
  { value: "hash", label: "File Hash", icon: Hash, placeholder: "MD5 / SHA1 / SHA256" },
  { value: "organization", label: "Organization", icon: Building, placeholder: "Company name..." },
];

const SOURCE_COLORS: Record<string, string> = {
  "web-check:dns": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "web-check:ssl": "text-green-400 bg-green-500/10 border-green-500/20",
  "web-check:whois": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "web-check:headers": "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "web-check:ports": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "web-check:threats": "text-red-400 bg-red-500/10 border-red-500/20",
  "web-check:tech-stack": "text-pink-400 bg-pink-500/10 border-pink-500/20",
  "web-check:redirects": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "Shodan": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  "VirusTotal": "text-red-400 bg-red-500/10 border-red-500/20",
  "crt.sh": "text-teal-400 bg-teal-500/10 border-teal-500/20",
  "AbuseIPDB": "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "AlienVault OTX": "text-violet-400 bg-violet-500/10 border-violet-500/20",
};

interface SearchResult {
  _id?: string;
  query: string;
  queryType: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  date?: string;
  fetchedAt?: string;
  riskScore: number;
  tags: string[];
  category?: string;
  data?: Record<string, any>;
}

interface HistoryItem {
  _id: string;
  query: string;
  queryType: string;
  resultCount: number;
  createdAt: string;
}

function RiskBadge({ score }: { score: number }) {
  let color = "text-emerald-400 bg-emerald-400/15 border-emerald-400/30";
  let label = "LOW";
  if (score >= 75) { color = "text-red-400 bg-red-400/15 border-red-400/30"; label = "HIGH"; }
  else if (score >= 50) { color = "text-amber-400 bg-amber-400/15 border-amber-400/30"; label = "MED"; }
  else if (score >= 25) { color = "text-yellow-400 bg-yellow-400/15 border-yellow-400/30"; label = "LOW"; }
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${color} flex-shrink-0 min-w-[52px]`}>
      <span className="text-lg font-bold tabular-nums">{score}</span>
      <span className="text-[8px] uppercase tracking-wider font-mono">{label}</span>
    </div>
  );
}

function DataPreview({ data }: { data: Record<string, any> }) {
  const [expanded, setExpanded] = useState(false);
  if (!data || Object.keys(data).length === 0) return null;
  const preview = JSON.stringify(data, null, 2);
  const truncated = preview.length > 300 ? preview.slice(0, 300) + "..." : preview;
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[9px] text-slate-600 hover:text-cyan-400 transition-colors font-mono"
      >
        <Eye className="w-3 h-3" />
        {expanded ? "Hide raw data" : "View raw data"}
      </button>
      {expanded && (
        <pre className="mt-1 text-[9px] font-mono text-slate-500 bg-[#050b14] rounded-lg p-2 overflow-auto max-h-40 border border-[#1e3a5f]/30">
          {preview}
        </pre>
      )}
      {!expanded && (
        <pre className="mt-1 text-[9px] font-mono text-slate-600 truncate">
          {truncated}
        </pre>
      )}
    </div>
  );
}

export default function OSINTSearch() {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState(SEARCH_TYPES[0]);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searchMeta, setSearchMeta] = useState<{ count: number; source: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTime, setSearchTime] = useState<number>(0);

  // Load history on mount
  useEffect(() => {
    fetch("/api/search")
      .then(r => r.json())
      .then(data => setHistory(data.history || []))
      .catch(() => {});
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    setSearchMeta(null);
    setActiveTab("all");
    const t0 = Date.now();

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, queryType: selectedType.value }),
      });
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setSearchMeta({ count: data.count || data.results.length, source: data.source || "unknown" });
        // Refresh history
        fetch("/api/search")
          .then(r => r.json())
          .then(d => setHistory(d.history || []))
          .catch(() => {});
      }
    } catch {}
    setSearchTime(Date.now() - t0);
    setLoading(false);
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const repeatSearch = (q: string, qt: string) => {
    const type = SEARCH_TYPES.find(t => t.value === qt) || SEARCH_TYPES[0];
    setQuery(q);
    setSelectedType(type);
    setShowHistory(false);
  };

  // Group results by category
  const categories = results
    ? ["all", ...Array.from(new Set(results.map(r => r.category || r.source.split(":")[1] || "other")))]
    : [];

  const filteredResults = results
    ? (activeTab === "all" ? results : results.filter(r => {
        const cat = r.category || r.source.split(":")[1] || "other";
        return cat === activeTab;
      }))
    : [];

  const ACTIVE_SOURCES = ["Web-Check", "crt.sh", "Shodan", "VirusTotal", "AbuseIPDB", "OTX", "IPInfo", "NVD"];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-mono text-cyan-400/80 tracking-wider">OSINT ENGINE</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Intelligence Search</h1>
        <p className="text-slate-500 text-sm mt-0.5">Multi-source OSINT lookup across 50+ intelligence databases</p>
      </div>

      {/* Search Card */}
      <div className="glass rounded-2xl p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            {/* Type dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTypeMenu(!showTypeMenu)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#050b14] border border-[#1e3a5f]/80 text-sm text-white hover:border-cyan-500/40 transition-all whitespace-nowrap min-w-[160px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <selectedType.icon className="w-4 h-4 text-cyan-400" />
                  <span>{selectedType.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showTypeMenu ? "rotate-180" : ""}`} />
              </button>

              {showTypeMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowTypeMenu(false)} />
                  <div className="absolute top-full left-0 mt-1 w-52 glass rounded-xl overflow-hidden shadow-2xl z-30 border border-[#2d5a8e]/30">
                    {SEARCH_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => { setSelectedType(type); setShowTypeMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all ${
                          selectedType.value === type.value
                            ? "bg-cyan-500/15 text-cyan-300"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={selectedType.placeholder}
                className="w-full input-dark pl-11 pr-4 py-3 rounded-xl text-sm font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? "Scanning..." : "Analyze"}
            </button>
          </div>

          {/* Active sources badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-600">Active Sources:</span>
            {ACTIVE_SOURCES.map((src) => (
              <span key={src} className="px-2 py-0.5 rounded-full bg-[#0d1b2e] border border-[#1e3a5f]/40 text-[10px] text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {src}
              </span>
            ))}
          </div>
        </form>
      </div>

      {/* Loading animation */}
      {loading && (
        <div className="glass rounded-2xl p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Database className="w-6 h-6 text-cyan-500/60" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Scanning Intelligence Sources</p>
              <p className="text-slate-500 text-sm mt-1">Querying databases for &quot;{query}&quot;...</p>
              <p className="text-slate-600 text-xs mt-0.5">This may take up to 25 seconds for full multi-source results</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {["Web-Check", "crt.sh", "Shodan", "VirusTotal", "AbuseIPDB", "NVD"].map((src, i) => (
                <div key={src} className="flex items-center gap-1 text-[10px] text-slate-600 font-mono" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" />
                  {src}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="glass rounded-2xl overflow-hidden">
          {/* Results header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]/40 bg-[#0a1628]/50">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold text-sm">Scan Complete</span>
                {searchMeta?.source && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono">
                    via {searchMeta.source}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                {results.length} results for &quot;{query}&quot;
                {searchTime > 0 && <span className="text-slate-600 ml-2">in {(searchTime / 1000).toFixed(1)}s</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[10px] text-slate-500 font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Category tabs */}
          {categories.length > 2 && (
            <div className="flex gap-1 px-5 py-3 border-b border-[#1e3a5f]/30 overflow-x-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                    activeTab === cat
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-500 hover:text-slate-300 border border-transparent"
                  }`}
                >
                  {cat.toUpperCase()}
                  {cat === "all" && <span className="ml-1 text-slate-600">({results.length})</span>}
                </button>
              ))}
            </div>
          )}

          {/* Result list */}
          <div className="divide-y divide-[#1e3a5f]/30">
            {filteredResults.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-600 text-sm">
                No results in this category
              </div>
            ) : (
              filteredResults.map((result, i) => {
                const sourceColor = SOURCE_COLORS[result.source] || "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
                return (
                  <div key={i} className="p-4 hover:bg-white/[0.02] transition-all">
                    <div className="flex items-start gap-4">
                      <RiskBadge score={result.riskScore} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sourceColor}`}>
                            {result.source}
                          </span>
                          {result.category && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e3a5f]/30 text-slate-500 border border-[#2d5a8e]/20">
                              {result.category}
                            </span>
                          )}
                          {(result.date || result.fetchedAt) && (
                            <span className="text-[10px] text-slate-600 font-mono">
                              {timeAgo(result.date || result.fetchedAt || "")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-200 font-semibold leading-relaxed">{result.title}</p>
                        <p className="text-xs text-slate-400 font-mono leading-relaxed mt-1">{result.snippet}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.tags?.map((t, idx) => (
                            <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e3a5f]/40 text-slate-500 border border-[#2d5a8e]/30">
                              #{t}
                            </span>
                          ))}
                        </div>
                        {result.data && <DataPreview data={result.data} />}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => copyToClipboard(result.snippet, i)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-white"
                          title="Copy snippet"
                        >
                          {copiedIdx === i ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-white"
                          title="Open source"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-5 py-3 border-t border-[#1e3a5f]/40 bg-[#050b14]/50 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[10px] text-slate-600">Results are for intelligence purposes only. Verify before action. Data sourced from public OSINT databases.</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {results && results.length === 0 && !loading && (
        <div className="glass rounded-2xl p-8 text-center">
          <Info className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No intelligence found</p>
          <p className="text-slate-600 text-sm mt-1">No data found for &quot;{query}&quot;. Try a different query or search type.</p>
        </div>
      )}

      {/* Search History */}
      <div className="glass rounded-xl overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-300">Search History</span>
            {history.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e3a5f]/50 text-slate-500 border border-[#2d5a8e]/30">
                {history.length}
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showHistory ? "rotate-180" : ""}`} />
        </button>
        {showHistory && (
          <div className="border-t border-[#1e3a5f]/40">
            {history.length > 0 ? (
              <div className="divide-y divide-[#1e3a5f]/30">
                {history.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => repeatSearch(item.query, item.queryType)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-all cursor-pointer group"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    <span className="font-mono text-sm text-slate-300 flex-1 truncate">{item.query}</span>
                    <span className="text-[10px] text-slate-600 uppercase bg-[#0d1b2e] px-1.5 py-0.5 rounded border border-[#1e3a5f]/40">{item.queryType}</span>
                    <span className="text-[10px] text-slate-500">{item.resultCount} results</span>
                    <span className="text-[10px] text-slate-600">{timeAgo(item.createdAt)}</span>
                    <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-center text-slate-600 text-sm">No search history yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
