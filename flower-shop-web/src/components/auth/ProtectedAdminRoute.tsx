import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAdminToken } from "@/services/api";

export function ProtectedAdminRoute() {
  const location = useLocation();
  if (!getAdminToken()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
