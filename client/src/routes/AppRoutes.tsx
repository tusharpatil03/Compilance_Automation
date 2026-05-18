import { BrowserRouter } from "react-router-dom";
import { ProtectedRoutes } from "./ProtectedRoutes";
import { PublicRoutes } from "./PublicRoutes";
import { AuthProvider } from "../context/AuthContext";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoutes />
        <PublicRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}