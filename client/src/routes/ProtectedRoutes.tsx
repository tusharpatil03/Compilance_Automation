import { Route, Routes } from "react-router-dom";

export function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/dashboard"></Route>
    </Routes>
  );
}
