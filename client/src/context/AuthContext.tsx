// src/contexts/AuthContext.tsx
import { createContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

export interface User {
  id: string;
  email: string;
  role: "admin" | "user";
}

export interface AuthContextValue {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider(children: ReactNode) {
  const [user, setUser] = useState<User | null>(null);


  const value: AuthContextValue = {
    user,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export {AuthContext}
