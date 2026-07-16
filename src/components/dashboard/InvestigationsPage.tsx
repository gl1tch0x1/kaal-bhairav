"use client";
import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen, Plus, Search, Filter, ChevronDown, X,
  AlertTriangle, Loader2, Trash2, Edit3, Eye, Tag,
  Target, Globe, Mail, Phone, User, Building
} from "lucide-react";
import { timeAgo, getSeverityColor, getStatusColor } from "@/lib/utils";

interface Investigation {
  id: number;
  title: string;
  description: string;
  status: string;
  severity: string;
  targetType: string;
  targetValue: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdByName: string | null;
  createdByUsername: string | null;
}

const TARGET_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  person: User,
  organization: Building,
  domain: Globe,
  ip: Target,
  phone: Phone,
  email: Mail,
  social: User,
};

const STATUS_OPTIONS = ["active", "pending", "closed", "archived"];
const SEVERITY_OPTIONS = ["critical", "high", "medium", "low", "info"];
const TARGET_TYPES = ["person", "organization", "domain", "ip", "phone", "email", "social"];

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [page, setPage] = useState(1);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newForm, setNewForm] = useState({
    title: "",
    description: "",
    status: "active",
    severity: "medium",
    targetType: "person",
    targetValue: "",
    tags: "",
  });

  const fetchInvestigations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search && { search }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterSeverity && { severity: filterSeverity }),
      });
      const res = await fetch(`/api/investigations?${params}`);
      const data = await res.json();
      setInvestigations(data.investigations || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [page, search, filterStatus, filterSeverity]);

  useEffect(() => {
    const timer = setTimeout(fetchInvestigations, 300);
    return () => clearTimeout(timer);
  }, [fetchInvestigations]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/investigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newForm,
          tags: newForm.tags ? newForm.tags.split(",").map((t) => t.trim()) : [],
        }),
      });
      if (res.ok) {
        setShowNewModal(false);
        setNewForm({ title: "", description: "", status: "active", severity: "medium", targetType: "person", targetValue: "", tags: "" });
        fetchInvestigations();
      }
    } catch {}
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this investigation?")) return;
    await fetch(`/api/investigations/${id}`, { method: "DELETE" });
    fetchInvestigations();
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    await fetch(`/api/investigations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchInvestigations();
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/80 tracking-wider">CASE MANAGEMENT</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Investigations</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} total cases in the system</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Investigation
        </button>
      </div>

      {/* Search + Filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search investigations..."
            className="w-full input-dark pl-10 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all ${showFilters ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-[#1e3a5f]/60 text-slate-500 hover:text-white"}`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(filterStatus || filterSeverity) && (
            <span className="w-2 h-2 rounded-full bg-red-400" />
          )}
        </button>

        {(filterStatus || filterSeverity) && (
          <button
            onClick={() => { setFilterStatus(""); setFilterSeverity(""); }}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="glass rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full input-dark px-3 py-2 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
              className="w-full input-dark px-3 py-2 rounded-lg text-sm"
            >
              <option value="">All Severity</option>
              {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : investigations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderOpen className="w-12 h-12 text-slate-700" />
            <p className="text-slate-500">No investigations found</p>
            <button onClick={() => setShowNewModal(true)} className="btn-primary px-4 py-2 rounded-xl text-sm">
              Create your first investigation
            </button>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e3a5f]/40 bg-[#050b14]/50">
                  <th className="text-left px-4 py-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Case</th>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider hidden md:table-cell">Target</th>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Severity</th>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider hidden lg:table-cell">Analyst</th>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider hidden lg:table-cell">Updated</th>
                  <th className="px-4 py-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3a5f]/20">
                {investigations.map((inv) => {
                  const TypeIcon = TARGET_TYPE_ICONS[inv.targetType] || Target;
                  return (
                    <tr key={inv.id} className="table-row-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#0d1b2e] border border-[#1e3a5f]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <TypeIcon className="w-3.5 h-3.5 text-cyan-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white leading-tight">{inv.title}</p>
                            {inv.description && (
                              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{inv.description}</p>
                            )}
                            {inv.tags && inv.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {inv.tags.slice(0, 2).map((tag) => (
                                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e3a5f]/60 text-slate-500 border border-[#2d5a8e]/30">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs font-mono text-slate-300">{inv.targetValue || "—"}</p>
                        <p className="text-[10px] text-slate-600 capitalize mt-0.5">{inv.targetType}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusUpdate(inv.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border bg-transparent cursor-pointer ${getStatusColor(inv.status)}`}
                          style={{ outline: "none" }}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#0a1628]">{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge-${inv.severity}`}>{inv.severity}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-slate-400">{inv.createdByName || inv.createdByUsername || "Unknown"}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-slate-500 font-mono">{timeAgo(inv.updatedAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-slate-500 hover:text-cyan-400 transition-all">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-amber-500/10 text-slate-500 hover:text-amber-400 transition-all">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e3a5f]/40 bg-[#050b14]/30">
                <p className="text-xs text-slate-500">
                  Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total} cases
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-xs border border-[#1e3a5f]/60 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-slate-500">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs border border-[#1e3a5f]/60 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Investigation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
          <div className="glass-strong relative w-full max-w-lg rounded-2xl shadow-2xl" style={{ border: "1px solid rgba(45,90,142,0.4)" }}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e3a5f]/40">
              <div>
                <h3 className="text-white font-bold text-base">New Investigation</h3>
                <p className="text-slate-500 text-xs mt-0.5">Create a new OSINT case</p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Case Title *</label>
                <input
                  type="text"
                  required
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  className="w-full input-dark px-4 py-3 rounded-xl text-sm"
                  placeholder="Investigation title..."
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  className="w-full input-dark px-4 py-3 rounded-xl text-sm resize-none"
                  rows={2}
                  placeholder="Case description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Status</label>
                  <select
                    value={newForm.status}
                    onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}
                    className="w-full input-dark px-3 py-2.5 rounded-xl text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#0a1628]">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Severity</label>
                  <select
                    value={newForm.severity}
                    onChange={(e) => setNewForm({ ...newForm, severity: e.target.value })}
                    className="w-full input-dark px-3 py-2.5 rounded-xl text-sm"
                  >
                    {SEVERITY_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#0a1628]">{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Target Type</label>
                  <select
                    value={newForm.targetType}
                    onChange={(e) => setNewForm({ ...newForm, targetType: e.target.value })}
                    className="w-full input-dark px-3 py-2.5 rounded-xl text-sm"
                  >
                    {TARGET_TYPES.map((t) => <option key={t} value={t} className="bg-[#0a1628]">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Target Value</label>
                  <input
                    type="text"
                    value={newForm.targetValue}
                    onChange={(e) => setNewForm({ ...newForm, targetValue: e.target.value })}
                    className="w-full input-dark px-3 py-2.5 rounded-xl text-sm font-mono"
                    placeholder="e.g. john@domain.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">
                  Tags <span className="text-slate-600">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={newForm.tags}
                  onChange={(e) => setNewForm({ ...newForm, tags: e.target.value })}
                  className="w-full input-dark px-4 py-2.5 rounded-xl text-sm"
                  placeholder="fraud, corporate, india"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-[#1e3a5f]/60 text-slate-400 hover:text-white text-sm transition-all">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
