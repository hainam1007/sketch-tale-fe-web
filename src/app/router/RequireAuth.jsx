import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { ErrorState, LoadingState } from "../../components/feedback/States";

export default function RequireAuth() {
  const { status, user, retryRestore } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingState label="Đang khôi phục phiên làm việc" fullPage />;
  if (status === "error") return <ErrorState title="Không thể khôi phục phiên" message="Máy chủ đang tạm thời không phản hồi. Hãy thử lại." onRetry={retryRestore} />;
  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
