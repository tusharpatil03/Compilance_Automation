// src/contexts/AuthContext.tsx
import { createContext, useState, type ReactNode } from "react";
import type { Tenant, AuthPayload } from "../features/auth/types/auth.types";
import { 
  saveToLocalStorage, 
  getFromLocalStorage, 
  removeFromLocalStorage 
} from "../utils/storage";

const TOKEN_KEY = 'auth_token';
const TENANT_KEY = 'tenant_data';

export interface AuthContextValue {
  tenant: Tenant | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tenant: Tenant, auth: AuthPayload) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Load auth state from localStorage on initial render
  const storedToken = getFromLocalStorage<string>(TOKEN_KEY);
  const storedTenant = getFromLocalStorage<Tenant>(TENANT_KEY);

  const [tenant, setTenant] = useState<Tenant | null>(storedTenant);
  const [token, setToken] = useState<string | null>(storedToken);
  const isLoading = false;

  const login = (tenantData: Tenant, auth: AuthPayload) => {
    setTenant(tenantData);
    setToken(auth.accessToken);
    saveToLocalStorage(TOKEN_KEY, auth.accessToken);
    saveToLocalStorage(TENANT_KEY, tenantData);
  };

  const logout = () => {
    setTenant(null);
    setToken(null);
    removeFromLocalStorage(TOKEN_KEY);
    removeFromLocalStorage(TENANT_KEY);
  };

  const value: AuthContextValue = {
    tenant,
    token,
    isAuthenticated: !!token && !!tenant,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
