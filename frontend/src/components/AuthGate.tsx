import { useCallback, useEffect, useState } from "react";
import { getAuthToken, setAuthToken } from "../lib/api.js";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  const tryRestore = useCallback(async () => {
    const saved = getAuthToken();
    if (!saved) {
      setChecking(false);
      return;
    }
    setAuthToken(saved);
    try {
      const res = await fetch("/api/auth/verify", {
        headers: { "x-auth-token": saved },
      });
      if (res.ok) {
        setAuthenticated(true);
        setChecking(false);
      } else {
        setAuthToken(null);
        setChecking(false);
      }
    } catch {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    tryRestore();
  }, [tryRestore]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthToken(password);
        setAuthenticated(true);
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Connection failed");
    }
  };
  if (checking) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h1 className="text-xl font-bold text-gray-100 mt-4">LifeOS</h1>
          <p className="text-sm text-gray-500 mt-1">Enter password to continue</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-gray-800/60 border border-gray-700/50 text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
