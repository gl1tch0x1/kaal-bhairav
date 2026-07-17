"use client";
import { useState, useEffect } from "react";
import { Video, Activity, Zap, Server, Settings, Focus, Minimize, Maximize, AlertTriangle, Crosshair, MapPin, QrCode, Smartphone } from "lucide-react";
import { timeAgo } from "@/lib/utils";

import { ICameraFeed, ISurveillanceEvent } from "@/types";

export default function CameraPage() {
  const [cameras, setCameras] = useState<ICameraFeed[]>([]);
  const [events, setEvents] = useState<ISurveillanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCam, setActiveCam] = useState<ICameraFeed | null>(null);
  const [customHost, setCustomHost] = useState("");
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [bypassToken, setBypassToken] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    const sse = new EventSource("/api/surveillance/stream");

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setCameras(data.cameras);
        setEvents(data.events);
        if (!activeCam && data.cameras.length > 0) {
          setActiveCam(data.cameras[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    sse.onerror = (err) => {
      console.error("SSE Error:", err);
      sse.close();
    };

    return () => sse.close();
  }, [activeCam]);

  const refreshBypassToken = () => {
    fetch("/api/auth/token")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.token) {
          setBypassToken(data.token);
        }
      })
      .catch((err) => console.error("Failed to fetch bypass token:", err));
  };

  useEffect(() => {
    refreshBypassToken();
    const interval = setInterval(refreshBypassToken, 240000); // Refresh every 4 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/host-ip")
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          setTunnelUrl(data.url);
        } else if (data.ip && data.ip !== "localhost") {
          setCustomHost(data.ip);
        }
      })
      .catch((err) => console.error("Failed to fetch host IP", err));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let base = window.location.origin;
      if (customHost) {
        const port = window.location.port ? `:${window.location.port}` : "";
        base = `http://${customHost}${port}`;
      } else if (tunnelUrl) {
        base = tunnelUrl;
      }

      if (bypassToken) {
        setLinkUrl(`${base}/api/auth/bypass?token=${encodeURIComponent(bypassToken)}`);
      } else {
        setLinkUrl(`${base}/dashboard/surveillance`);
      }
    }
  }, [customHost, tunnelUrl, bypassToken]);



  return (
    <div className="space-y-5 h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
            <Video className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-mono text-red-400/80 tracking-wider">LIVE SURVEILLANCE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Live Camera Stats</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time surveillance feeds and threat detection logs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 bg-[#0d1b2e] px-3 py-1.5 rounded-lg border border-[#1e3a5f]/40">
            CONNECTION: SECURE TCP
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
            SYSTEM ONLINE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 flex-1 min-h-0">
        {/* Main Feed */}
        <div className="lg:col-span-3 glass rounded-xl overflow-hidden flex flex-col relative">
          {/* Top Bar overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <span className="text-white font-mono text-sm tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {activeCam?.name || "CONNECTING..."}
              </span>
              <span className="text-[10px] text-slate-300 font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {activeCam?.location || "UNKNOWN"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> {activeCam?.fps || 0} FPS</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-cyan-400" /> {activeCam?.latency || 0}ms</span>
            </div>
          </div>

          {/* Camera Viewport (Simulated) */}
          <div className="flex-1 bg-[#050b14] relative flex items-center justify-center overflow-hidden">
            {/* Grid background overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
              backgroundImage: "linear-gradient(rgba(30,58,95,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px"
            }} />
            
            {/* Simulated UI Overlays */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-cyan-500/20 rounded-full flex items-center justify-center">
              <Focus className="w-8 h-8 text-cyan-500/30" />
            </div>

            {/* Random scanning line */}
            <div className="absolute inset-0 border-t border-cyan-500/20 shadow-[0_4px_10px_rgba(8,145,178,0.1)] w-full animate-scan" />

            {loading ? (
              <div className="flex flex-col items-center gap-4 relative z-10">
                <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-cyan-400 font-mono text-xs tracking-widest">ESTABLISHING CONNECTION...</p>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center opacity-40">
                <Video className="w-16 h-16 text-cyan-500 mb-4" />
                <p className="text-cyan-500 font-mono text-xs tracking-widest">SIMULATED LIVE FEED</p>
              </div>
            )}
            
            {/* Corners UI */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50" />
          </div>

          {/* Bottom Bar Controls */}
          <div className="border-t border-[#1e3a5f]/40 bg-[#0a1628]/80 p-3 flex items-center justify-between z-10">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar">
              {cameras.map(cam => (
                <button
                  key={cam._id}
                  onClick={() => setActiveCam(cam)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono transition-all border whitespace-nowrap ${
                    activeCam?._id === cam._id 
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(8,145,178,0.2)]" 
                      : "bg-[#050b14] border-[#1e3a5f]/40 text-slate-400 hover:border-cyan-500/30"
                  }`}
                >
                  {cam.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <button className="p-2 rounded bg-[#050b14] border border-[#1e3a5f]/40 text-slate-400 hover:text-cyan-400 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              <button className="p-2 rounded bg-[#050b14] border border-[#1e3a5f]/40 text-slate-400 hover:text-cyan-400 transition-colors">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Threat Detection Logs & QR Code Connection */}
        <div className="lg:col-span-1 flex flex-col gap-5 h-full min-h-0">
          
          {/* Top Panel: Detection Logs */}
          <div className="glass rounded-xl flex flex-col overflow-hidden flex-1 min-h-0">
            <div className="px-4 py-3 border-b border-[#1e3a5f]/40 bg-[#050b14]/50 flex items-center gap-2 flex-shrink-0">
              <Crosshair className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-white">Detection Logs</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                   <div key={i} className="h-16 bg-[#1e3a5f]/20 rounded-lg animate-pulse" />
                 ))
              ) : events.length > 0 ? (
                events.map((event, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#0d1b2e] border border-[#1e3a5f]/40 hover:border-orange-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                        event.severity === 'critical' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                        event.severity === 'high' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' :
                        'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                      }`}>
                        {event.type}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">{timeAgo(event.timestamp)}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">{event.description}</p>
                    <p className="text-[10px] text-cyan-500 font-mono mt-1 pt-1 border-t border-[#1e3a5f]/30">
                      Source: {typeof event.cameraId === "object" ? (event.cameraId as any)?.name : event.cameraId || "Unknown"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <AlertTriangle className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-xs text-center">No threats detected.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Panel: Mobile/Drone Pairing QR Code */}
          <div className="glass rounded-xl p-4 flex flex-col gap-3 flex-shrink-0 bg-[#0a1628]/60 border border-[#1e3a5f]/30">
            <div className="flex items-center gap-2 border-b border-[#1e3a5f]/20 pb-2">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Stream Pairing</h3>
            </div>
            
            <div className="flex flex-col items-center gap-2 bg-[#050b14]/80 p-3 rounded-lg border border-[#1e3a5f]/20">
              {linkUrl ? (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=0891b2&bgcolor=050b14&data=${encodeURIComponent(linkUrl)}`}
                  alt="Surveillance Pairing QR Code"
                  className="w-28 h-28 border border-cyan-500/30 p-1 rounded bg-[#050b14]"
                />
              ) : (
                <div className="w-28 h-28 flex items-center justify-center border border-dashed border-slate-700 rounded text-slate-500 text-xs">
                  Generating...
                </div>
              )}
              <span className="text-[9px] font-mono text-cyan-400/80 text-center break-all select-all px-1">
                {linkUrl || "establishing origin..."}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-slate-400 tracking-wider flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-cyan-400" /> Custom Host/LAN IP
              </label>
              <input 
                type="text" 
                placeholder="e.g. 192.168.1.100"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                className="w-full bg-[#050b14] border border-[#1e3a5f]/40 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 font-mono"
              />
              <p className="text-[9px] text-slate-500 leading-normal pt-1">
                Input your host LAN IP to override <code className="text-cyan-400">localhost</code>. Connect your mobile or drone receiver to scan and view stream overlays.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
