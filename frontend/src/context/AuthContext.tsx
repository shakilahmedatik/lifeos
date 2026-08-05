import type React from "react";
import { createContext, useContext, useState } from "react";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  pin?: string | null;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isPinLocked: boolean;
  login: (token: string, user: UserSession) => void;
  logout: () => void;
  unlockPin: (pin: string) => boolean;
  setPin: (pin: string) => void;
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

  const [isPinLocked, setIsPinLocked] = useState<boolean>(() => {
    const savedUser = localStorage.getItem("lifeos_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return Boolean(parsed.pin);
    }
    return false;
  });

  const login = (newToken: string, newUser: UserSession) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("lifeos_session_token", newToken);
    localStorage.setItem("lifeos_user", JSON.stringify(newUser));
    if (newUser.pin) {
      setIsPinLocked(true);
    } else {
      setIsPinLocked(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsPinLocked(false);
    localStorage.removeItem("lifeos_session_token");
    localStorage.removeItem("lifeos_user");
  };

  const unlockPin = (enteredPin: string): boolean => {
    if (user?.pin && user.pin === enteredPin) {
      setIsPinLocked(false);
      return true;
    }
    return false;
  };

  const setPin = (newPin: string) => {
    if (user) {
      const updated = { ...user, pin: newPin };
      setUser(updated);
      localStorage.setItem("lifeos_user", JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isPinLocked,
        login,
        logout,
        unlockPin,
        setPin,
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
