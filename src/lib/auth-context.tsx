import React, { createContext, useContext, useState } from "react";
import { type TokenResponse, getSavedUser, clearToken, clearUser } from "./api";

interface AuthContextValue {
  user: TokenResponse | null;
  setUser: (user: TokenResponse | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<TokenResponse | null>(() => getSavedUser());

  function setUser(u: TokenResponse | null) {
    setUserState(u);
  }

  function logout() {
    clearToken();
    clearUser();
    setUserState(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
