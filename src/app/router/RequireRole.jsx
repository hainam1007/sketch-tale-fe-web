import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";

export default function RequireRole({ roles }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
