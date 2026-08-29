import { createContext, type FC, type ReactNode, useContext, useEffect, useState } from "react";
import { getApiBaseUrl } from "../lib/api.js";
import {
  clearTauriStoredSession,
  getTauriStoredSession,
  setTauriStoredSession,
} from "../lib/auth/tauriAuth.js";
import { isTauri } from "../lib/dataSource.js";
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
      // In Tauri mode, check persistent store first
      if (isTauri()) {
        const stored = await getTauriStoredSession();
        if (stored?.user && isMounted) {
          setUser(stored.user);
          setToken(stored.token);
          setIsLoadingSession(false);
          return;
        }
      }

      try {
        const headers: Record<string, string> = {};
        if (token && token !== "session-token") {
          headers.Authorization = `Bearer ${token}`;
        }
        const API_BASE_URL = getApiBaseUrl();
        const fetchOptions: RequestInit = { headers };
        if (!isTauri()) {
          fetchOptions.credentials = "include";
        }

        const res = await fetch(`${API_BASE_URL}/api/auth/get-session`, fetchOptions);

        if (res.ok) {
          const data = await res.json();
          if (data?.user && isMounted) {
            setUser(data.user);
            const sessionToken = data.session?.token || token;
            if (sessionToken && sessionToken !== "session-token") {
              setToken(sessionToken);
              if (isTauri()) {
                setTauriStoredSession({ token: sessionToken, user: data.user });
              }
            } else {
              removeToken();
            }
          } else if (isMounted) {
            removeUser();
            removeToken();
          }
        } else if (res.status === 401 && isMounted) {
          removeUser();
          removeToken();
        }
      } catch (_err) {
        // Keep cached local user state if offline
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
      if (isTauri()) {
        setTauriStoredSession({ token: newToken, user: newUser });
        import("../lib/local-db/index.js").then(({ getLocalDb }) => {
          getLocalDb().then((db) => {
            db.execute("UPDATE _sync_meta SET last_sync_at = NULL, user_id = ? WHERE id = 1", [
              newUser.id,
            ]).catch(() => {});
          });
        });
      }
    } else {
      removeToken();
    }
    setUser(newUser);
  };

  const updateUser = (updatedUser: UserSession) => {
    setUser(updatedUser);
    if (isTauri() && token) {
      setTauriStoredSession({ token, user: updatedUser });
    }
  };

  const logout = () => {
    const API_BASE_URL = getApiBaseUrl();
    const fetchOptions: RequestInit = { method: "POST" };
    if (!isTauri()) {
      fetchOptions.credentials = "include";
    }
    fetch(`${API_BASE_URL}/api/auth/sign-out`, fetchOptions).catch(() => {});
    removeToken();
    removeUser();
    if (isTauri()) {
      clearTauriStoredSession();
      import("../lib/local-db/index.js").then(({ getLocalDb }) => {
        getLocalDb().then((db) => {
          db.execute(
            "UPDATE _sync_meta SET last_sync_at = NULL, user_id = NULL WHERE id = 1",
          ).catch(() => {});
        });
      });
    }
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
