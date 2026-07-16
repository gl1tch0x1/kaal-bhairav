"use client";
import { useState } from "react";
import {
  Search, Globe, Mail, Phone, Hash, User, Building,
  Loader2, CheckCircle, AlertCircle, ChevronDown, Clock,
  Copy, ExternalLink, Filter, Zap, Shield, Database
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

interface SearchResult {
  _id?: string;
  query: string;
  queryType: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  date?: string;
  riskScore: number;
  tags: string[];
}

interface HistoryItem {
  id: number;
  query: string;
  queryType: string;
  resultCount: number;
  createdAt: string;
}

export default function OSINTSearch() {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState(SEARCH_TYPES[0]);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, queryType: selectedType.value }),
      });
      const data = await res.json();
      if (data.results) setResults(data.results);
    } catch {}
    setLoading(false);
  };

  const loadHistory = async () => {
    if (!showHistory) {
      try {
        const res = await fetch("/api/search");
        const data = await res.json();
        setHistory(data.history || []);
      } catch {}
    }
    setShowHistory(!showHistory);
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return "text-emerald-400";
    if (conf >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceBg = (conf: number) => {
    if (conf >= 90) return "bg-emerald-400/20 border-emerald-400/30";
    if (conf >= 75) return "bg-yellow-400/20 border-yellow-400/30";
    return "bg-red-400/20 border-red-400/30";
  };

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
          {/* Type selector + input */}
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

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-600">Data Sources:</span>
            {["WHOIS", "Shodan", "VirusTotal", "HaveIBeenPwned", "Hunter.io", "IPInfo", "Censys", "URLScan"].map((src) => (
              <span key={src} className="px-2 py-0.5 rounded-full bg-[#0d1b2e] border border-[#1e3a5f]/40 text-[10px] text-slate-500">
                {src}
              </span>
            ))}
          </div>
        </form>
      </div>

      {/* Results */}
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
              <p className="text-slate-500 text-sm mt-1">Querying 50+ databases for &quot;{query}&quot;...</p>
            </div>
            <div className="flex gap-2">
              {["WHOIS", "Shodan", "VirusTotal", "DNS", "GeoIP"].map((src, i) => (
                <div key={src} className="flex items-center gap-1 text-[10px] text-slate-600 font-mono" style={{ animationDelay: `${i * 0.2}s` }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" />
                  {src}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]/40 bg-[#0a1628]/50">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold text-sm">Scan Complete</span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">{results.length} results found for &quot;{query}&quot;</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="divide-y divide-[#1e3a5f]/30">
            {results.map((result, i) => (
              <div key={i} className="p-4 hover:bg-white/[0.02] transition-all table-row-hover">
                <div className="flex items-start gap-4">
                  {/* Confidence Score */}
                  <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${getConfidenceBg(result.riskScore)} flex-shrink-0`}>
                    <span className={`text-lg font-bold tabular-nums ${getConfidenceColor(result.riskScore)}`}>
                      {result.riskScore}
                    </span>
                    <span className={`text-[8px] uppercase tracking-wider ${getConfidenceColor(result.riskScore)}`}>
                      RISK
                    </span>
                  </div>

                  {/* Data */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                        {result.source}
                      </span>
                      {result.date && <span className="text-[10px] text-slate-600 font-mono">{timeAgo(result.date)}</span>}
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
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(result.snippet, i)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-white"
                      title="Copy"
                    >
                      {copiedIdx === i ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-white" title="Open Source">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-[#1e3a5f]/40 bg-[#050b14]/50 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[10px] text-slate-600">Results are for intelligence purposes only. Verify before action. Data sourced from public OSINT databases.</p>
          </div>
        </div>
      )}

      {/* Search History */}
      <div className="glass rounded-xl overflow-hidden">
        <button
          onClick={loadHistory}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-300">Search History</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showHistory ? "rotate-180" : ""}`} />
        </button>
        {showHistory && (
          <div className="border-t border-[#1e3a5f]/40">
            {history.length > 0 ? (
              <div className="divide-y divide-[#1e3a5f]/30">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => { setQuery(item.query); setShowHistory(false); }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-all cursor-pointer group"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    <span className="font-mono text-sm text-slate-300 flex-1">{item.query}</span>
                    <span className="text-[10px] text-slate-600 uppercase">{item.queryType}</span>
                    <span className="text-[10px] text-slate-500">{item.resultCount} results</span>
                    <span className="text-[10px] text-slate-600">{timeAgo(item.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-center text-slate-600 text-sm">No search history</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
