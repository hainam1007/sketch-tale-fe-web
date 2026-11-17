import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ClockCountdown, XCircle } from "@phosphor-icons/react";
import { useAuth } from "../../auth/useAuth";
import "../parent-plan.css";

export default function ParentPaymentReturnPage() {
  const { pathname } = useLocation();
  const { status, user, refreshUser } = useAuth();
  const wasCancelled = pathname === "/payment/cancel";
  const isParent = status === "authenticated" && user?.role === "parent";
  const parentPlanPath = isParent
    ? "/parent/plan"
    : "/auth/login";
  const profileRefresh = useMutation({ mutationFn: refreshUser, retry: false });
  const refreshProfile = profileRefresh.mutate;

  useEffect(() => {
    if (!wasCancelled && isParent) refreshProfile();
  }, [isParent, refreshProfile, wasCancelled]);

  return (
    <div className="payment-return-page container">
      <section className="payment-return-card" role="status">
        <span className={`payment-return-icon ${wasCancelled ? "is-cancelled" : ""}`} aria-hidden="true">
          {wasCancelled
            ? <XCircle size={34} weight="duotone" />
            : <ClockCountdown size={34} weight="duotone" />}
        </span>
        <p className="workspace-eyebrow">SKETCHTALE · PAYOS</p>
        <h1>{wasCancelled ? "Bạn đã quay lại từ PayOS" : "Đang chờ xác nhận giao dịch"}</h1>
        <p>
          {wasCancelled
            ? "Trang quay về chưa thể xác nhận đơn đã được hủy trong hệ thống. Hãy kiểm tra trạng thái gói trước khi thử thanh toán lại."
            : "PayOS đã đưa bạn quay lại SketchTale. Backend cần xác nhận giao dịch và cập nhật quyền lợi trước khi gói được xem là đã kích hoạt."}
        </p>
        <p className="payment-return-note">
          {wasCancelled
            ? "Trạng thái đơn có thể cập nhật chậm. Hãy kiểm tra gói hiện tại trước khi tạo giao dịch mới."
            : "Giao dịch có thể cần vài phút để cập nhật. Hãy kiểm tra trạng thái gói trước khi thử thanh toán lại."}
        </p>
        {!wasCancelled && isParent && (
          <>
            <button
              className="workspace-button"
              type="button"
              disabled={profileRefresh.isPending}
              onClick={() => refreshProfile()}
            >
              {profileRefresh.isPending ? "Đang kiểm tra…" : "Kiểm tra lại quyền lợi"}
            </button>
            {profileRefresh.isSuccess && profileRefresh.data !== false && (
              <p className="payment-return-note" role="status">
                Hồ sơ đã được tải lại từ Backend. Nếu gói vẫn là Free, Backend chưa áp dụng quyền lợi cho giao dịch; đừng thanh toán lại.
              </p>
            )}
            {profileRefresh.isError && (
              <p className="payment-return-note" role="alert">
                Chưa tải lại được hồ sơ. Giao dịch vẫn cần Backend xác nhận; hãy thử kiểm tra lại sau.
              </p>
            )}
            {profileRefresh.isSuccess && profileRefresh.data === false && (
              <p className="payment-return-note" role="alert">
                Phiên đăng nhập đã thay đổi trong lúc kiểm tra. Hãy tải lại trang trước khi xem quyền lợi.
              </p>
            )}
          </>
        )}
        <div className="payment-return-actions">
          <Link className="workspace-button" to={parentPlanPath}>
            {isParent ? "Xem trạng thái gói" : "Đăng nhập để xem gói"}
          </Link>
          <Link className="payment-return-back" to="/">
            <ArrowLeft size={17} aria-hidden="true" /> Về trang chủ
          </Link>
        </div>
      </section>
    </div>
  );
}
