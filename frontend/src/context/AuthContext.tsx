import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export interface UserSession {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoadingSession: boolean;
  login: (token: string, user: UserSession) => void;
  updateUser: (updatedUser: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("lifeos_session_token");
  });

  const [user, setUser] = useState<UserSession | null>(() => {
    const savedUser = localStorage.getItem("lifeos_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch("/api/auth/get-session", {
          headers,
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.user && isMounted) {
            setUser(data.user);
            const sessionToken = data.session?.token || token || "session-token";
            setToken(sessionToken);
            localStorage.setItem("lifeos_user", JSON.stringify(data.user));
            localStorage.setItem("lifeos_session_token", sessionToken);
          } else if (isMounted) {
            // Session expired or invalid on backend
            setUser(null);
            setToken(null);
            localStorage.removeItem("lifeos_user");
            localStorage.removeItem("lifeos_session_token");
          }
        }
      } catch (_err) {
        // Network or fetch error - keep cached local user state if offline
      } finally {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      }
    };

    checkSession();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = (newToken: string, newUser: UserSession) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("lifeos_session_token", newToken);
    localStorage.setItem("lifeos_user", JSON.stringify(newUser));
  };

  const updateUser = (updatedUser: UserSession) => {
    setUser(updatedUser);
    localStorage.setItem("lifeos_user", JSON.stringify(updatedUser));
  };

  const logout = () => {
    fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem("lifeos_session_token");
    localStorage.removeItem("lifeos_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoadingSession,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
