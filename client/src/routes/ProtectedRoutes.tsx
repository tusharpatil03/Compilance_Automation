import { Routes, Route} from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DashBoard from "../pages/protected/DashBoard";
import ApiManagementPage from "../pages/protected/ApiManagementPage";

export function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();

  // if (!isAuthenticated) {
  //   console.log(isAuthenticated);
  //   return null;
  // }

  return (
    <Routes>
      <Route path="/dashboard" element={<DashBoard />} />
      <Route path="/api-keys" element={<ApiManagementPage />} />
    </Routes>
  );
}
