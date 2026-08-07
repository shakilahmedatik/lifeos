import { createContext, type FC, type ReactNode, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "../lib/hooks/useLocalStorage.js";

export interface UserSession {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoadingSession: boolean;
  login: (token: string | null, user: UserSession) => void;
  updateUser: (updatedUser: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken, removeToken] = useLocalStorage<string | null>(
    "lifeos_session_token",
    null,
  );
  const [user, setUser, removeUser] = useLocalStorage<UserSession | null>("lifeos_user", null);

  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token && token !== "session-token") {
          headers.Authorization = `Bearer ${token}`;
        }
        const API_BASE_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "");
        const res = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
          headers,
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.user && isMounted) {
            setUser(data.user);
            const sessionToken = data.session?.token || token;
            // Only set if we actually have a valid non-fallback token
            if (sessionToken && sessionToken !== "session-token") {
              setToken(sessionToken);
            } else {
              removeToken(); // Rely entirely on cookies
            }
          } else if (isMounted) {
            // Session expired or invalid on backend
            removeUser();
            removeToken();
          }
        } else if (res.status === 401 && isMounted) {
          // Explicitly unauthorized, meaning session is invalid
          removeUser();
          removeToken();
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
  }, [token, removeToken, removeUser, setToken, setUser]);

  const login = (newToken: string | null, newUser: UserSession) => {
    if (newToken && newToken !== "session-token") {
      setToken(newToken);
    } else {
      removeToken();
    }
    setUser(newUser);
  };

  const updateUser = (updatedUser: UserSession) => {
    setUser(updatedUser);
  };

  const logout = () => {
    const API_BASE_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "");
    fetch(`${API_BASE_URL}/api/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    removeToken();
    removeUser();
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
