"use client";
import { useState, useEffect } from "react";
import { Settings, User, Shield, Bell, Database, Key, Save, Eye, EyeOff } from "lucide-react";

interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: string | null;
  lastLogin: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [secError, setSecError] = useState("");
  const [secSuccess, setSecSuccess] = useState("");
  const [panicPin, setPanicPin] = useState("");
  const [panicPinSaved, setPanicPinSaved] = useState(false);

  const handlePasswordUpdate = async () => {
    setSecError(""); setSecSuccess("");
    if (passwords.new !== passwords.confirm) {
      setSecError("New passwords do not match"); return;
    }
    if (passwords.new.length < 6) {
      setSecError("Password must be at least 6 characters"); return;
    }
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      });
      const data = await res.json();
      if (!res.ok) setSecError(data.error);
      else { setSecSuccess("Password updated successfully"); setPasswords({ current: "", new: "", confirm: "" }); }
    } catch {
      setSecError("Network error");
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); });
      
    if (typeof window !== "undefined") {
      setPanicPin(localStorage.getItem("panicPin") || "");
    }
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "api", label: "API Keys", icon: Key },
    { id: "system", label: "System", icon: Database },
  ];

  const mockApiKey = "kb_live_sk_8x9f2k3m7p1q4r6t0v5w2y8z3n6b4j";

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-mono text-slate-400/80 tracking-wider">CONFIGURATION</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account and platform configuration</p>
      </div>

      <div className="flex gap-5">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0">
          <div className="glass rounded-xl overflow-hidden">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-cyan-500/10 text-cyan-300 border-l-2 border-l-cyan-400"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <div className="glass rounded-xl p-6 space-y-5">
              <h3 className="text-white font-semibold">Profile Information</h3>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">
                    {user?.fullName?.[0] || user?.username?.[0] || "U"}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-semibold">
                    <Shield className="w-2.5 h-2.5" />
                    {user?.role?.toUpperCase() || "ANALYST"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: user?.fullName || "", placeholder: "John Doe" },
                  { label: "Username", value: user?.username || "", placeholder: "analyst_001" },
                  { label: "Email Address", value: user?.email || "", placeholder: "name@domain.com" },
                  { label: "Role", value: user?.role || "analyst", placeholder: "Role", readOnly: true },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">{field.label}</label>
                    <input
                      type="text"
                      defaultValue={field.value}
                      placeholder={field.placeholder}
                      readOnly={field.readOnly}
                      className={`w-full input-dark px-4 py-2.5 rounded-xl text-sm ${field.readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Bio / Notes</label>
                <textarea
                  placeholder="Brief description..."
                  className="w-full input-dark px-4 py-3 rounded-xl text-sm resize-none"
                  rows={3}
                />
              </div>

              <button
                onClick={handleSave}
                className={`btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${saved ? "!bg-emerald-600" : ""}`}
              >
                <Save className="w-4 h-4" />
                {saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="glass rounded-xl p-6 space-y-5">
              <h3 className="text-white font-semibold">Security Settings</h3>

              <div className="space-y-4">
                {secError && <p className="text-red-400 text-xs px-3 py-2 bg-red-500/10 border border-red-500/20 rounded">{secError}</p>}
                {secSuccess && <p className="text-emerald-400 text-xs px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded">{secSuccess}</p>}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Current Password</label>
                  <input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} className="w-full input-dark px-4 py-2.5 rounded-xl text-sm" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">New Password</label>
                  <input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="w-full input-dark px-4 py-2.5 rounded-xl text-sm" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Confirm New Password</label>
                  <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} className="w-full input-dark px-4 py-2.5 rounded-xl text-sm" placeholder="••••••••" />
                </div>
              </div>

              <div className="border-t border-[#1e3a5f]/40 pt-5">
                <h4 className="text-sm font-semibold text-white mb-3">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/60">
                  <div>
                    <p className="text-sm text-white font-medium">Authenticator App</p>
                    <p className="text-xs text-slate-500 mt-0.5">Use Google Authenticator or Authy</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl border border-cyan-500/30 text-cyan-400 text-xs hover:bg-cyan-500/10 transition-all">
                    Enable
                  </button>
                </div>
              </div>

              <div className="border-t border-red-500/30 pt-5">
                <h4 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  PANIC MODE CONFIGURATION
                </h4>
                <div className="px-4 py-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <p className="text-xs text-slate-400 mb-4">
                    Configure a 4-digit security code. When Panic Mode is triggered, the interface will lock completely until this code is entered. Three incorrect attempts will result in a hard freeze.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="password"
                      maxLength={4}
                      value={panicPin}
                      onChange={(e) => setPanicPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="••••"
                      className="w-24 input-dark px-4 py-2.5 rounded-xl text-center text-lg tracking-[0.5em] focus:border-red-500 transition-colors"
                    />
                    <button
                      onClick={() => {
                        if (panicPin.length === 4) {
                          localStorage.setItem("panicPin", panicPin);
                          setPanicPinSaved(true);
                          setTimeout(() => setPanicPinSaved(false), 2000);
                        }
                      }}
                      disabled={panicPin.length !== 4}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        panicPinSaved
                          ? "bg-emerald-600 text-white"
                          : "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 disabled:opacity-50"
                      }`}
                    >
                      {panicPinSaved ? "Saved!" : "Set Code"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1e3a5f]/40 pt-5">
                <h4 className="text-sm font-semibold text-white mb-1">Active Sessions</h4>
                <p className="text-xs text-slate-500 mb-3">Devices currently logged in</p>
                <div className="space-y-2">
                  {[
                    { device: "Chrome · Windows 11", ip: "203.0.113.45", location: "New Delhi, India", current: true },
                    { device: "Firefox · macOS", ip: "198.51.100.22", location: "Mumbai, India", current: false },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/60">
                      <div>
                        <p className="text-xs text-white font-medium">{session.device}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{session.ip} · {session.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.current ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">CURRENT</span>
                        ) : (
                          <button className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handlePasswordUpdate} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Save className="w-4 h-4" />
                Update Password
              </button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="glass rounded-xl p-6 space-y-5">
              <h3 className="text-white font-semibold">Notification Preferences</h3>
              <div className="space-y-3">
                {[
                  { label: "Critical Threat Alerts", desc: "Immediate notification for critical threats", enabled: true },
                  { label: "New Investigation Assigned", desc: "When a case is assigned to you", enabled: true },
                  { label: "Daily Intelligence Digest", desc: "Daily summary of OSINT findings", enabled: false },
                  { label: "System Status Updates", desc: "API and source availability changes", enabled: true },
                  { label: "Weekly Reports", desc: "Automated weekly intelligence reports", enabled: false },
                  { label: "Data Breach Alerts", desc: "When target found in breach database", enabled: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/60">
                    <div>
                      <p className="text-sm text-white font-medium">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${item.enabled ? "bg-cyan-600" : "bg-[#1e3a5f]"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="glass rounded-xl p-6 space-y-5">
              <h3 className="text-white font-semibold">API Keys</h3>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs text-amber-400">⚠️ Keep your API keys secret. Never share them publicly.</p>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Platform API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={mockApiKey}
                      readOnly
                      className="w-full input-dark px-4 py-2.5 rounded-xl text-sm font-mono"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(mockApiKey)}
                    className="px-4 py-2.5 rounded-xl border border-[#1e3a5f]/60 text-slate-400 hover:text-white text-sm transition-all"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">External API Integrations</h4>
                <div className="space-y-3">
                  {[
                    { name: "Shodan API", key: "SHODAN_****_****_XY2K", status: "connected" },
                    { name: "VirusTotal API", key: "VT_****_****_A9B3", status: "connected" },
                    { name: "IPInfo Token", key: "Not configured", status: "not_set" },
                  ].map((api) => (
                    <div key={api.name} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/60">
                      <div>
                        <p className="text-sm text-white font-medium">{api.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{api.key}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                        api.status === "connected"
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : "text-slate-500 bg-slate-500/10 border border-slate-500/20"
                      }`}>
                        {api.status === "connected" ? "CONNECTED" : "NOT SET"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="glass rounded-xl p-6 space-y-5">
              <h3 className="text-white font-semibold">System Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Platform Version", value: "v2.4.1" },
                  { label: "Database", value: "PostgreSQL 15.x" },
                  { label: "Node Runtime", value: "Node.js 20.x" },
                  { label: "Region", value: "ap-south-1 (Mumbai)" },
                  { label: "Uptime", value: "99.97%" },
                  { label: "Last Deploy", value: "2024-01-16" },
                ].map((info) => (
                  <div key={info.label} className="px-4 py-3 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/60">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{info.label}</p>
                    <p className="text-sm text-white font-mono mt-1">{info.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Data Retention Policy</h4>
                <div className="space-y-2">
                  {[
                    { label: "Search History", value: "90 days" },
                    { label: "Activity Logs", value: "1 year" },
                    { label: "Archived Cases", value: "5 years" },
                  ].map((policy) => (
                    <div key={policy.label} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/60">
                      <p className="text-xs text-slate-400">{policy.label}</p>
                      <p className="text-xs font-mono text-cyan-400">{policy.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
