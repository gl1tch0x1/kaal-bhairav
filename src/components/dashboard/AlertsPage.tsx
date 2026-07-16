"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle, AlertTriangle, Info, Zap, Loader2, Plus, X } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface Alert {
  id: number;
  title: string;
  message: string | null;
  severity: string;
  isRead: boolean;
  createdAt: string;
}

const SEVERITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  critical: AlertTriangle,
  high: Zap,
  medium: Bell,
  low: Info,
  info: Info,
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnread, setShowUnread] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState({ title: "", message: "", severity: "medium" });
  const [submitting, setSubmitting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const url = showUnread ? "/api/alerts?unread=true" : "/api/alerts";
      const res = await fetch(url);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch {}
    setLoading(false);
  }, [showUnread]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAsRead = async (id: number) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAlerts();
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.isRead);
    await Promise.all(unread.map((a) => fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id }),
    })));
    fetchAlerts();
  };

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAlert),
    });
    setNewAlert({ title: "", message: "", severity: "medium" });
    setShowCreate(false);
    setSubmitting(false);
    fetchAlerts();
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400/80 tracking-wider">ALERT CENTER</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {unreadCount > 0 ? <span className="text-amber-400">{unreadCount} unread alerts</span> : "All caught up"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-3 py-2 rounded-xl text-sm border border-[#1e3a5f]/60 text-slate-400 hover:text-white hover:border-emerald-500/40 transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark All Read
            </button>
          )}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Alert
          </button>
        </div>
      </div>

      {/* Create Alert Form */}
      {showCreate && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Create Alert</h3>
            <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={createAlert} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newAlert.title}
              onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
              placeholder="Alert title..."
              className="input-dark px-3 py-2.5 rounded-xl text-sm md:col-span-2"
            />
            <select
              value={newAlert.severity}
              onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
              className="input-dark px-3 py-2.5 rounded-xl text-sm"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
            <input
              type="text"
              value={newAlert.message}
              onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
              placeholder="Alert message..."
              className="input-dark px-3 py-2.5 rounded-xl text-sm md:col-span-2"
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
          </form>
        </div>
      )}

      {/* Filter Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowUnread(false)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!showUnread ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" : "text-slate-500 hover:text-white"}`}
        >
          All Alerts
        </button>
        <button
          onClick={() => setShowUnread(true)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${showUnread ? "bg-red-500/15 text-red-300 border border-red-500/30" : "text-slate-500 hover:text-white"}`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="w-5 h-5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass rounded-xl py-16 text-center">
            <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No alerts to show</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = SEVERITY_ICONS[alert.severity] || Bell;
            return (
              <div
                key={alert.id}
                className={`glass rounded-xl p-4 flex items-start gap-4 transition-all ${
                  !alert.isRead ? "border-l-2 border-l-amber-500/60" : "opacity-70"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  alert.severity === "critical" ? "bg-red-500/15 border border-red-500/30" :
                  alert.severity === "high" ? "bg-orange-500/15 border border-orange-500/30" :
                  alert.severity === "medium" ? "bg-yellow-500/15 border border-yellow-500/30" :
                  "bg-blue-500/15 border border-blue-500/30"
                }`}>
                  <Icon className={`w-4 h-4 ${
                    alert.severity === "critical" ? "text-red-400" :
                    alert.severity === "high" ? "text-orange-400" :
                    alert.severity === "medium" ? "text-yellow-400" :
                    "text-blue-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{alert.title}</h4>
                    <span className={`badge-${alert.severity}`}>{alert.severity}</span>
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 pulse-dot" />
                    )}
                  </div>
                  {alert.message && (
                    <p className="text-xs text-slate-400 mt-1">{alert.message}</p>
                  )}
                  <p className="text-[10px] text-slate-600 mt-1.5 font-mono">{timeAgo(alert.createdAt)}</p>
                </div>
                {!alert.isRead && (
                  <button
                    onClick={() => markAsRead(alert.id)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
