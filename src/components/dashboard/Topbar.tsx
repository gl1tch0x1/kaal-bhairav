"use client";
import { useState, useEffect } from "react";
import { Bell, Search, ChevronDown, User, Shield, Clock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: string | null;
}

export default function Topbar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [time, setTime] = useState(new Date());
  const [alertCount, setAlertCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {});

    fetch("/api/alerts?unread=true")
      .then((r) => r.json())
      .then((d) => { if (d.alerts) setAlertCount(d.alerts.length); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  return (
    <header className="h-14 bg-[#070e1a]/95 backdrop-blur-md border-b border-[#1e3a5f]/50 flex items-center px-4 gap-4 sticky top-0 z-20">
      {/* Left: Page context */}
      <div className="flex items-center gap-3 flex-1">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1b2e] border border-[#1e3a5f]/50">
          <Clock className="w-3.5 h-3.5 text-cyan-500/70" />
          <span className="font-mono text-xs text-cyan-400/80 tracking-wider">
            {mounted ? formatTime(time) : "--:--:--"}
          </span>
        </div>
        <div className="hidden lg:block text-xs text-slate-600 font-mono">
          {mounted ? formatDate(time) : "---, --- --, ----"}
        </div>
      </div>

      {/* Center: Quick search */}
      <div className="flex-1 max-w-xs hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            type="text"
            placeholder="Quick search..."
            className="w-full input-dark pl-9 pr-4 py-1.5 rounded-lg text-xs"
            onFocus={() => router.push("/dashboard/search")}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e3a5f]/60 text-slate-500 font-mono border border-[#2d5a8e]/30">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* Right: Status & User */}
      <div className="flex items-center gap-2">
        {/* Threat level indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-semibold text-amber-400 tracking-wider">ELEVATED</span>
        </div>

        {/* Alerts Bell */}
        <button
          onClick={() => router.push("/dashboard/alerts")}
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Bell className="w-4 h-4 text-slate-500 hover:text-slate-300" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[#1e3a5f]/60"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.fullName?.[0] || user?.username?.[0] || "U"}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{user?.fullName || user?.username || "Analyst"}</p>
              <p className="text-[9px] text-slate-500 capitalize mt-0.5">{user?.role || "analyst"}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500 hidden md:block" />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 glass rounded-xl shadow-2xl overflow-hidden z-50 border border-[#2d5a8e]/30">
                <div className="px-4 py-3 border-b border-[#1e3a5f]/40">
                  <p className="text-sm font-semibold text-white">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] text-cyan-400 capitalize font-semibold">{user?.role || "analyst"}</span>
                  </div>
                </div>
                <div className="p-2 space-y-0.5">
                  <button
                    onClick={() => { router.push("/dashboard/settings"); setShowProfile(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
