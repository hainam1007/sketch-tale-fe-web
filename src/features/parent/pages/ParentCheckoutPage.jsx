import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  CheckCircle,
  Bank,
  Wallet,
  ArrowLeft,
} from "@phosphor-icons/react";
import { publicService } from "../../public/services/publicService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import "../parent-plan.css";
import "../parent-experience.css";
export default function ParentCheckoutPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const catalog = useQuery({
    queryKey: queryKeys.publicPlanAvailability(),
    queryFn: publicService.getPlanAvailability,
  });
  const plan =
    catalog.data?.plans.find((item) => item.id === params.get("plan")) ||
    (location.state?.plan?.id === params.get("plan")
      ? location.state.plan
      : null);
  const [method, setMethod] = useState("wallet");
  const [status, setStatus] = useState("ready");
  const [outcome, setOutcome] = useState("success");
  if (!plan && catalog.isPending)
    return <LoadingState label="Đang chuẩn bị gói đã chọn" />;
  if (!plan)
    return (
      <div className="parent-page">
        <Link to="/parent/plan">← Chọn lại gói</Link>
        <ErrorState
          title="Chưa tìm thấy gói đã chọn"
          message="Quay lại danh sách để chọn một gói sử dụng."
          onRetry={catalog.isError ? () => catalog.refetch() : undefined}
        />
      </div>
    );
  const price =
    plan.price == null
      ? "Chưa công bố giá"
      : plan.price === 0
        ? "Miễn phí"
        : `${new Intl.NumberFormat("vi-VN").format(plan.price)}${plan.currency === "VND" ? " ₫" : ""}`;
  return (
    <div className="parent-checkout-page family-workspace">
      <Link className="family-back" to="/parent/plan">
        <ArrowLeft /> Quay lại gói sử dụng
      </Link>
      <header>
        <p className="workspace-eyebrow">THÊM NHỮNG CÂU CHUYỆN MỚI</p>
        <h1>
          {status === "success"
            ? "Gia đình đã sẵn sàng khám phá"
            : "Hoàn tất lựa chọn của gia đình"}
        </h1>
        <p>Thanh toán mô phỏng · Không thu tiền, không kích hoạt gói thật.</p>
      </header>
      <ol className="family-checkout-steps">
        <li>1. Chọn gói</li>
        <li aria-current={status === "ready" ? "step" : undefined}>
          2. Thanh toán
        </li>
        <li aria-current={status === "success" ? "step" : undefined}>
          3. Hoàn tất
        </li>
      </ol>
      {status === "success" ? (
        <section className="family-panel family-payment-success" role="status">
          <CheckCircle size={64} weight="duotone" />
          <h2>Đăng ký {plan.name} thành công — demo</h2>
          <p>
            Đây là kết quả mô phỏng để trình bày luồng đăng ký. Quyền lợi tài
            khoản thật được giữ nguyên.
          </p>
          <p>
            Phương thức:{" "}
            {
              {
                wallet: "Ví điện tử",
                bank: "Chuyển khoản",
                card: "Thẻ ngân hàng",
              }[method]
            }
          </p>
          <Link className="workspace-button" to="/parent/library">
            Khám phá thư viện truyện
          </Link>
          <button
            className="workspace-button workspace-button-quiet"
            onClick={() => setStatus("ready")}
          >
            Thử lại luồng demo
          </button>
        </section>
      ) : (
        <div className="checkout-layout">
          <form
            className="family-panel family-payment"
            onSubmit={(event) => {
              event.preventDefault();
              setStatus(outcome);
            }}
          >
            <h2>Chọn phương thức thanh toán</h2>
            <div className="family-payment-methods">
              {[
                [
                  "wallet",
                  Wallet,
                  "Ví điện tử",
                  "Xác nhận nhanh trong ứng dụng ví",
                ],
                [
                  "bank",
                  Bank,
                  "Chuyển khoản",
                  "Quét mã qua ứng dụng ngân hàng",
                ],
                [
                  "card",
                  CreditCard,
                  "Thẻ ngân hàng",
                  "Thẻ nội địa hoặc quốc tế",
                ],
              ].map(([value, Icon, label, description]) => (
                <label
                  key={value}
                  className={method === value ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="method"
                    value={value}
                    checked={method === value}
                    onChange={() => {
                      setMethod(value);
                      setStatus("ready");
                    }}
                  />
                  <Icon size={27} />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </div>
            <div className="family-payment-preview">
              <CreditCard size={32} />
              <div>
                <strong>
                  {method === "card"
                    ? "Thẻ thử nghiệm •••• 4242"
                    : method === "bank"
                      ? "Màn xác nhận chuyển khoản mẫu"
                      : "Màn xác nhận ví điện tử mẫu"}
                </strong>
                <p>Không cần nhập thông tin tài chính thật để trải nghiệm.</p>
              </div>
            </div>
            <label className="family-demo-outcome">
              Kịch bản demo
              <select
                value={outcome}
                onChange={(event) => setOutcome(event.target.value)}
              >
                <option value="success">Thanh toán thành công</option>
                <option value="failed">Thanh toán thất bại</option>
                <option value="cancelled">Người dùng hủy</option>
              </select>
            </label>
            {["failed", "cancelled"].includes(status) && (
              <p role="alert" className="family-payment-error">
                {status === "failed"
                  ? "Thanh toán demo chưa thành công. Bạn có thể thử lại hoặc đổi phương thức."
                  : "Đã hủy thanh toán demo. Bạn chưa bị tính phí."}
              </p>
            )}
            <button className="workspace-button" type="submit">
              {status === "ready"
                ? "Xác nhận thanh toán demo"
                : "Thử thanh toán lại"}
            </button>
          </form>
          <aside className="checkout-order-card">
            <p className="workspace-eyebrow">LỰA CHỌN CỦA GIA ĐÌNH</p>
            <h2>Gói {plan.name}</h2>
            <p className="checkout-order-price">{price}</p>
            {plan.price > 0 && !plan.currency && <small>Đơn vị tiền đang chờ xác nhận.</small>}
            <p>
              {plan.durationDays
                ? `${plan.durationDays} ngày sử dụng`
                : "Thời hạn theo gói"}
            </p>
            <ul>
              {(plan.highlights || plan.limits || [])
                .slice(0, 5)
                .map((item) => (
                  <li key={item}>
                    <CheckCircle size={17} />
                    {item}
                  </li>
                ))}
            </ul>
            <p>
              Giá và quyền lợi lấy từ danh mục. Kết quả thanh toán chỉ là minh
              họa.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
