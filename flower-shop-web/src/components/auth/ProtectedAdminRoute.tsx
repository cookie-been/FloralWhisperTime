import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAdminSession, getAdminToken } from "@/services/api";

export function ProtectedAdminRoute() {
  const location = useLocation();
  const token = getAdminToken();
  const session = getAdminSession();
  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
