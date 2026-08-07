import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles, User as UserIcon } from "lucide-react";
import { type FC, type SubmitEvent, useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import Button from "../ui/Button.js";
import ErrorBanner from "../ui/ErrorBanner.js";
import Input from "../ui/Input.js";

export const AuthModal: FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md bg-surface-elevated border border-border text-primary rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header Branding */}
        <div className="p-6 pt-8 text-center border-b border-border bg-card/30">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted border border-accent/20 text-accent shadow-inner">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">LifeOS</h2>
          <p className="text-xs text-secondary mt-1">
            {mode === "login"
              ? "Welcome back! Access your personal productivity hub."
              : "Create an account to start mastering your routines and habits."}
          </p>

          {/* Segmented Mode Selector */}
          <div className="grid grid-cols-2 p-1 mt-6 bg-input/40 border border-border rounded-xl">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("login");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                mode === "login"
                  ? "bg-accent text-surface shadow-sm font-bold"
                  : "text-muted hover:text-primary"
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
                  ? "bg-accent text-surface shadow-sm font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <ErrorBanner message={error} />}

          {mode === "register" && (
            <Input
              label="Full Name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              leftIcon={<UserIcon className="h-4 w-4" />}
            />
          )}

          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-8 text-muted hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button
            type="submit"
            loading={loading}
            icon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
            className="w-full py-3 mt-2 shadow-lg"
          >
            {mode === "login" ? "Sign In to LifeOS" : "Create LifeOS Account"}
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-muted">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode(mode === "login" ? "register" : "login");
                }}
                className="text-accent font-medium hover:underline focus:outline-none"
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
