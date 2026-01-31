import { BrowserRouter } from "react-router-dom";
import { ProtectedRoutes } from "./ProtectedRoutes";
import { PublicRoutes } from "./PublicRoutes";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <ProtectedRoutes />
      <PublicRoutes />
    </BrowserRouter>
  );
}
