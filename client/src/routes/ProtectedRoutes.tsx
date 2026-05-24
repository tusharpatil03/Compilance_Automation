import { Routes, Route } from "react-router-dom";
import DashBoard from "../pages/protected/DashBoard";
import ApiManagementPage from "../pages/protected/ApiManagementPage";
import WebhooksPage from "../pages/protected/WebhooksPage";

export function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashBoard />} />
      <Route path="/api-keys" element={<ApiManagementPage />} />
      <Route path="/webhooks" element={<WebhooksPage />} />
    </Routes>
  );
}
