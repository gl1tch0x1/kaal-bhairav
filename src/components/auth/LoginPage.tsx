"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, AlertTriangle, User, Lock, Mail, ChevronRight, Zap } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

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
        router.push("/dashboard");
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

      {/* LEFT PANEL - Kaal Bhairav */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col items-center justify-center overflow-hidden">
        {/* Dark atmospheric background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0005] via-[#150010] to-[#050015]" />

        {/* Cyber grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "linear-gradient(rgba(220,38,38,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Radial glow behind deity */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-red-900/20 blur-[80px]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[400px] h-[400px] rounded-full bg-orange-900/15 blur-[60px]" />
        </div>

        {/* Sacred circle decorative */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[520px] h-[520px] rounded-full border border-red-900/30 animate-[spin_40s_linear_infinite]" />
          <div className="absolute w-[440px] h-[440px] rounded-full border border-orange-900/20 animate-[spin_30s_linear_infinite_reverse]" />
          <div className="absolute w-[560px] h-[560px] rounded-full border border-red-800/15" />
          {/* Mandala dots */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-red-600/50 border border-red-400/60"
              style={{
                transform: `rotate(${i * 45}deg) translateY(-260px)`,
                transformOrigin: "center 260px",
              }}
            />
          ))}
        </div>

        {/* Kaal Bhairav image */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-[-30px] rounded-full bg-gradient-to-b from-red-900/30 via-transparent to-transparent blur-[30px]" />

            <div className="relative w-[380px] h-[480px]">
              <Image
                src="/kaal-bhairav.png"
                alt="Kaal Bhairav"
                fill
                className="object-contain object-center drop-shadow-[0_0_60px_rgba(220,38,38,0.5)]"
                style={{ filter: "drop-shadow(0 0 40px rgba(220,38,38,0.6)) drop-shadow(0 0 80px rgba(120,0,0,0.4))" }}
                priority
              />
            </div>
          </div>

          {/* Title below deity */}
          <div className="text-center mt-4 z-10">
            <h1
              className="text-4xl font-bold tracking-[0.15em] text-gradient-red uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              KAAL BHAIRAV
            </h1>
            <p className="text-red-400/70 text-sm tracking-[0.4em] mt-1 uppercase">
              Open Source Intelligence
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-red-600/60" />
              <div className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-red-600/60" />
            </div>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 mt-8 justify-center max-w-sm z-10">
            {[
              { icon: "🕵️", label: "Deep Web Recon" },
              { icon: "🌐", label: "Network Intel" },
              { icon: "📡", label: "Signal Tracking" },
              { icon: "🔐", label: "Crypto Analysis" },
              { icon: "📊", label: "Data Correlation" },
              { icon: "⚡", label: "Real-time Alerts" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-red-900/40 bg-red-950/20 text-red-300/80"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom scanline effect */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050b14] to-transparent" />

        {/* Corner decorations */}
        <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-red-600/40 rounded-tl-lg" />
        <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-red-600/40 rounded-tr-lg" />
        <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-red-600/40 rounded-bl-lg" />
        <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-red-600/40 rounded-br-lg" />
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
              KAAL BHAIRAV
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
            <span>© 2024</span>
          </div>
        </div>
      </div>
    </div>
  );
}
