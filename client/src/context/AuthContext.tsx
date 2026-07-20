// src/contexts/AuthContext.tsx
import { createContext, useState, type ReactNode } from "react";
import type { Tenant } from "../types/auth.types";
import { clearLocalStorage, saveToLocalStorage } from "../utils/storage";
import { useNavigate } from "react-router-dom";

export interface AuthContextValue {
  tenant?: Tenant;
  isLoading: boolean;
  login: (tenant: Tenant) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Load auth state from localStorage on initial render
  const isLoading = false;

  const [tenant, setTenant] = useState<Tenant | undefined>(() => {
    const storedTenant = localStorage.getItem("tenant");
    return storedTenant ? (JSON.parse(storedTenant) as Tenant) : undefined;
  });

  const navigate = useNavigate();

  const login = (tenant: Tenant) => {
    setTenant(tenant);
    saveToLocalStorage("tenant", tenant);
    navigate("/dashboard");
  };

  const logout = () => {
    clearLocalStorage();
    cookieStore.delete("token");
    navigate("/login");
  };

  const value: AuthContextValue = {
    tenant,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
