import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import DashBoard from "../pages/protected/DashBoard";
import ApiManagementPage from "../pages/protected/ApiManagementPage";

export function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<DashBoard />} />
      <Route path="/api-keys" element={<ApiManagementPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
