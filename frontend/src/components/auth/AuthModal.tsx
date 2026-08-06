import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import Button from "../ui/Button.js";

export const AuthModal: React.FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email";
      const payload = mode === "login" ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Authentication failed" }));
        throw new Error(body.message || "Authentication failed");
      }

      const data = await res.json();
      const sessionToken = data.token || data.session?.token || "session-token";
      const userData = data.user || { id: "user-1", name: name || email.split("@")[0], email };

      login(sessionToken, userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl shadow-amber-500/5 overflow-hidden animate-scale-up">
        {/* Header Branding */}
        <div className="p-6 pt-8 text-center border-b border-slate-800/60 bg-gradient-to-b from-slate-800/40 to-transparent">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner shadow-amber-500/20">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">LifeOS</h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === "login"
              ? "Welcome back! Access your personal productivity hub."
              : "Create an account to start mastering your routines and habits."}
          </p>

          {/* Segmented Mode Selector */}
          <div className="grid grid-cols-2 p-1 mt-6 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("login");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                mode === "login"
                  ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("register");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                mode === "register"
                  ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2.5 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            icon={!loading ? <ArrowRight className="h-4 w-4 ml-1" /> : undefined}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all duration-200 mt-2"
          >
            {mode === "login" ? "Sign In to LifeOS" : "Create LifeOS Account"}
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode(mode === "login" ? "register" : "login");
                }}
                className="text-amber-400 font-medium hover:underline focus:outline-none"
              >
                {mode === "login" ? "Create one now" : "Sign in here"}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
