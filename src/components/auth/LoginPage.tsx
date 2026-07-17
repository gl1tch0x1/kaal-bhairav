"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, AlertTriangle, User, Lock, Mail, ChevronRight, Zap } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [from, setFrom] = useState("/dashboard");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const fromParam = params.get("from");
      if (fromParam) {
        setFrom(fromParam);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = "/api/auth/login";
      const body = { username: form.username, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }

      if (data.success) {
        router.push(from);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden relative bg-[#050b14]">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-purple-900/10 blur-[80px]" />
      </div>

      {/* LEFT PANEL - Kaal Bhairav (Aggressive Focal Design) */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col items-center justify-center overflow-hidden">

        {/* Injected Thunder Animation Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes thunder {
            0% { opacity: 0; background-color: transparent; }
            1% { opacity: 0.8; background-color: rgba(255, 255, 255, 0.4); }
            2% { opacity: 0; }
            3% { opacity: 0.6; background-color: rgba(220, 38, 38, 0.6); }
            4% { opacity: 0; }
            20% { opacity: 0; }
            21% { opacity: 0.9; background-color: rgba(255, 255, 255, 0.5); }
            23% { opacity: 0; }
            55% { opacity: 0; }
            56% { opacity: 0.7; background-color: rgba(255, 255, 255, 0.3); }
            57% { opacity: 0; }
            100% { opacity: 0; }
          }
          .thunder-bg {
            animation: thunder 8s infinite;
            mix-blend-mode: overlay;
          }
          .thunder-flash {
            animation: thunder 12s infinite reverse;
            mix-blend-mode: color-dodge;
          }
        `}} />

        {/* Pitch Black Void Background */}
        <div className="absolute inset-0 bg-black z-0" />

        {/* Thunder flashes layers */}
        <div className="absolute inset-0 z-0 thunder-bg" />
        <div className="absolute inset-0 z-0 thunder-flash opacity-50 bg-[url('https://www.transparenttextures.com/patterns/crissxcross.png')]" />

        {/* Deep aggressive red radial gradient in the center */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="w-[800px] h-[800px] rounded-full bg-red-900/30 blur-[100px] animate-[pulse_3s_ease-in-out_infinite]" />
        </div>

        {/* Kaal Bhairav Imposing Image */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pt-10">
          <div className="relative w-[700px] h-[700px] flex items-center justify-center transform transition-transform duration-1000 hover:scale-105">
            <Image
              src="/logo.png"
              alt="Kaal Bhairav"
              fill
              className="object-contain object-center z-10"
              style={{
                mixBlendMode: "lighten",
                filter: "drop-shadow(0 0 50px rgba(255,0,0,0.8)) contrast(1.4) brightness(1.1)",
                maskImage: "radial-gradient(circle at center, black 50%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(circle at center, black 50%, transparent 100%)"
              }}
              priority
            />
          </div>

          {/* Aggressive Title Overlay positioned slightly over the bottom of the image */}
          <div className="absolute bottom-16 text-center z-20">
            {/* <h1
              className="text-6xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-red-500 to-red-900 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              KAAL BHAIRAV
            </h1> */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="w-24 h-1 bg-gradient-to-r from-transparent to-red-600" />
              {/* <p className="text-red-500 text-sm tracking-[0.5em] font-bold uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                ABSOLUTE DOMINANCE
              </p> */}
              <div className="w-24 h-1 bg-gradient-to-l from-transparent to-red-600" />
            </div>
          </div>
        </div>

        {/* Scanline overlay for aggressive cyber feel */}
        <div className="absolute inset-0 opacity-10 pointer-events-none z-20" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "100% 4px"
        }} />

        {/* Corner aggressive brackets */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-red-600 z-20" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-red-600 z-20" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-red-600 z-20" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-red-600 z-20" />
      </div>

      {/* RIGHT PANEL - Auth Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo / Brand for mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1
              className="text-3xl font-bold tracking-widest text-gradient-red uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              KAAL BHAIRAVA
            </h1>
            <p className="text-slate-500 text-xs tracking-widest mt-1">OSINT PLATFORM</p>
          </div>

          {/* Auth Card */}
          <div className="glass rounded-2xl p-8 shadow-2xl" style={{ border: "1px solid rgba(45,90,142,0.3)" }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Secure Access
                </h2>
                <p className="text-xs text-slate-500">
                  Intelligence Platform Portal
                </p>
              </div>
            </div>

            {/* System status line */}
            <div className="flex items-center gap-2 mb-6 mt-4 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-[10px] font-mono text-emerald-400/80 tracking-wider">
                SYSTEM SECURE · ENCRYPTION ACTIVE · AES-256
              </span>
            </div>

            {/* Authentication Form */}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wider uppercase">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="username"
                    value={form.username || ""}
                    onChange={handleChange}
                    required
                    className="w-full input-dark pl-10 pr-4 py-3 rounded-xl text-sm"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wider uppercase">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password || ""}
                    onChange={handleChange}
                    required
                    className="w-full input-dark pl-10 pr-11 py-3 rounded-xl text-sm font-mono"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-xs text-cyan-500/70 hover:text-cyan-400 transition-colors">
                  Forgot credentials?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Access Platform</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-[#1e3a5f]/40">
              <p className="text-center text-xs text-slate-600">
                By accessing, you agree to our{" "}
                <span className="text-cyan-600/70 hover:text-cyan-500 cursor-pointer">Terms of Service</span>
                {" "}and{" "}
                <span className="text-cyan-600/70 hover:text-cyan-500 cursor-pointer">Privacy Policy</span>
              </p>
              <p className="text-center text-[10px] text-slate-700 mt-2 font-mono">
                CLASSIFIED · AUTHORIZED PERSONNEL ONLY
              </p>
            </div>
          </div>

          {/* Version info */}
          <div className="text-center mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-700 font-mono">
            <span>v2.4.1</span>
            <span>·</span>
            <span>KAAL BHAIRAV OSINT</span>
            <span>·</span>
            <span>© 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
