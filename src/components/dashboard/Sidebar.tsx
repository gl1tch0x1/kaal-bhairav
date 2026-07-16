"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Search, FolderOpen, Bell, Activity,
  Settings, LogOut, Shield, ChevronLeft, ChevronRight,
  Globe, Radar, Database, Users, Target, Map, FileText,
  Zap, Eye, Video
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "OSINT Search", href: "/dashboard/search", icon: Search },
  { label: "Investigations", href: "/dashboard/investigations", icon: FolderOpen },
  { label: "Target Analysis", href: "/dashboard/targets", icon: Target },
  { label: "Network Map", href: "/dashboard/network", icon: Map },
  { label: "Intelligence Feed", href: "/dashboard/feed", icon: Radar, badge: "LIVE", badgeColor: "text-emerald-400 bg-emerald-400/10" },
  { label: "Live Surveillance", href: "/dashboard/surveillance", icon: Video, badge: "CCTV", badgeColor: "text-red-400 bg-red-400/10" },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { label: "Activity Log", href: "/dashboard/activity", icon: Activity },
  { label: "Data Sources", href: "/dashboard/sources", icon: Database },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
];

const bottomItems: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen transition-all duration-300 ease-in-out z-30",
        "bg-[#070e1a] border-r border-[#1e3a5f]/60",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-[#1e3a5f]/40",
        collapsed && "justify-center px-2"
      )}>
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-lg glow-red">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#070e1a] pulse-dot" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
              KAAL BHAIRAV
            </p>
            <p className="text-[9px] text-slate-600 tracking-[0.2em] uppercase">OSINT Platform</p>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-[#0d1b2e] border border-[#1e3a5f]/80 flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:border-cyan-500/40 transition-all z-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav Status */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-[9px] text-slate-600 tracking-[0.3em] uppercase mb-2">Navigation</p>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative",
                isActive
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r-full" />
              )}
              <item.icon className={cn(
                "flex-shrink-0 w-4 h-4",
                isActive ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-400"
              )} />
              {!collapsed && (
                <>
                  <span className="flex-1 font-medium text-xs">{item.label}</span>
                  {item.badge && (
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider", item.badgeColor)}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-[#1e3a5f]/40 px-2 py-3 space-y-0.5">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            <item.icon className="w-4 h-4 flex-shrink-0 text-slate-600" />
            {!collapsed && <span className="font-medium text-xs">{item.label}</span>}
          </Link>
        ))}

        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:text-red-400" />
          {!collapsed && <span className="font-medium text-xs">Logout</span>}
        </button>
      </div>

      {/* System info at bottom */}
      {!collapsed && (
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
            <div className="w-1 h-1 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-[9px] font-mono text-emerald-500/70 tracking-wider">SYS ONLINE</span>
          </div>
        </div>
      )}
    </aside>
  );
}
