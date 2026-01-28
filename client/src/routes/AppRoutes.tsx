import { Route, Routes, BrowserRouter } from "react-router-dom";
import { ProtectedRoutes } from "./ProtectedRoutes";
import { PublicRoutes } from "./PublicRoutes";

function LogMsg() {
  console.log("hello");

  return <div>Hello</div>;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<LogMsg />}></Route>
      </Routes>
      <ProtectedRoutes />
      <PublicRoutes />
    </BrowserRouter>
  );
}
