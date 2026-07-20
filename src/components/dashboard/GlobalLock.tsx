"use client";
import { useState, useEffect } from "react";
import { ShieldAlert, AlertOctagon, Lock } from "lucide-react";

export default function GlobalLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);

  const checkLockStatus = () => {
    if (typeof window !== "undefined") {
      const locked = localStorage.getItem("isLocked") === "true";
      setIsLocked(locked);
      
      const storedAttempts = parseInt(localStorage.getItem("failedAttempts") || "0", 10);
      setFailedAttempts(storedAttempts);
    }
  };

  useEffect(() => {
    checkLockStatus();
    
    // Listen for custom event triggered by Topbar
    const handlePanicEvent = () => checkLockStatus();
    window.addEventListener("panic-mode-toggled", handlePanicEvent);
    
    // Listen for storage events (if triggered in another tab)
    window.addEventListener("storage", handlePanicEvent);

    return () => {
      window.removeEventListener("panic-mode-toggled", handlePanicEvent);
      window.removeEventListener("storage", handlePanicEvent);
    };
  }, []);

  const handleUnlock = () => {
    if (failedAttempts >= 3) {
      setError("SYSTEM HARD LOCKED. Max attempts exceeded.");
      return;
    }

    const storedPin = localStorage.getItem("panicPin");
    
    if (!storedPin) {
      // If no PIN was ever configured, unlock safely to prevent bricking
      localStorage.setItem("isLocked", "false");
      setIsLocked(false);
      return;
    }

    if (pin === storedPin) {
      localStorage.setItem("isLocked", "false");
      localStorage.setItem("failedAttempts", "0");
      setIsLocked(false);
      setPin("");
      setError("");
      setFailedAttempts(0);
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem("failedAttempts", newAttempts.toString());
      setPin("");
      
      if (newAttempts >= 3) {
        setError("SYSTEM HARD LOCKED. Admin intervention required.");
      } else {
        setError(`Incorrect PIN. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  if (!isLocked) return null;

  const isHardLocked = failedAttempts >= 3;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="max-w-md w-full bg-[#0a1220] border-2 border-red-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center relative overflow-hidden">
        
        {/* Warning Background Graphics */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            {isHardLocked ? (
              <AlertOctagon className="w-10 h-10 text-red-500" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-red-500" />
            )}
          </div>
          
          <h1 className="text-3xl font-black text-red-500 tracking-widest mb-2 font-mono">
            {isHardLocked ? "SYSTEM LOCKED" : "PANIC MODE"}
          </h1>
          
          <p className="text-slate-400 text-sm mb-8">
            {isHardLocked 
              ? "Maximum authorization failures exceeded. Interface frozen." 
              : "Emergency lockdown active. Enter the 4-digit security code to resume operations."}
          </p>

          <div className="w-full space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isHardLocked}
                placeholder="••••"
                className="w-full bg-black/50 border-2 border-red-500/30 rounded-xl px-12 py-4 text-center text-3xl font-mono text-white tracking-[1em] focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUnlock();
                }}
              />
            </div>
            
            {error && (
              <p className="text-red-400 font-bold text-sm bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}

            <button
              onClick={handleUnlock}
              disabled={isHardLocked || pin.length !== 4}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm mt-4"
            >
              Unlock Interface
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
