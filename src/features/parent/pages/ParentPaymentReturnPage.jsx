import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ClockCountdown, XCircle } from "@phosphor-icons/react";
import { useAuth } from "../../auth/useAuth";
import "../parent-plan.css";

export default function ParentPaymentReturnPage() {
  const { pathname } = useLocation();
  const { status, user } = useAuth();
  const wasCancelled = pathname === "/payment/cancel";
  const parentPlanPath = status === "authenticated" && user?.role === "parent"
    ? "/parent/plan"
    : "/auth/login";

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
        <div className="payment-return-actions">
          <Link className="workspace-button" to={parentPlanPath}>
            {status === "authenticated" && user?.role === "parent" ? "Xem trạng thái gói" : "Đăng nhập để xem gói"}
          </Link>
          <Link className="payment-return-back" to="/">
            <ArrowLeft size={17} aria-hidden="true" /> Về trang chủ
          </Link>
        </div>
      </section>
    </div>
  );
}
