import { ArrowRight, CheckCircle, Package } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import { queryKeys } from "../../../lib/api/queryKeys";
import { publicService } from "../../public/services/publicService";
import "../parent-plan.css";

export default function ParentPlanPage() {
  const plansQuery = useQuery({
    queryKey: queryKeys.publicPlanAvailability(),
    queryFn: ({ signal }) => publicService.getPlanAvailability({ signal }),
    staleTime: 300_000,
  });

  const availability = plansQuery.data;
  const plans = availability?.plans || [];
  const currentPlanId = null;

  return (
    <div className="parent-plan-page">
      <header className="plan-page-heading">
        <div>
          <p className="workspace-eyebrow"><Package size={15} aria-hidden="true" /> GÓI VÀ HẠN MỨC</p>
          <h1>Gói đang đồng hành cùng gia đình</h1>
          <p>Xem các gói và quyền lợi dành cho gia đình.</p>
        </div>
        <span className="plan-heading-icon" aria-hidden="true"><Package size={27} /></span>
      </header>

      <section className="plan-current-card plan-summary-primary plan-current-card-unavailable" aria-labelledby="current-plan-title">
        <div className="plan-current-main">
          <div className="plan-current-kicker">GÓI CỦA GIA ĐÌNH</div>
          <h2 id="current-plan-title">Thông tin gói hiện tại chưa có</h2>
          <p>Bạn có thể tham khảo các lựa chọn và quyền lợi của từng gói bên dưới.</p>
          <a className="workspace-button plan-primary-action" href="#plan-options">Xem các gói <ArrowRight size={16} aria-hidden="true" /></a>
        </div>
      </section>

      <section className="plan-options-section" id="plan-options" aria-labelledby="plan-options-title">
        <div className="plan-section-heading plan-options-heading">
          <div><p className="workspace-eyebrow">LỰA CHỌN CHO GIA ĐÌNH</p><h2 id="plan-options-title">Chọn gói phù hợp với nhịp đọc</h2><p>So sánh quyền lợi và hạn mức của từng gói dành cho gia đình.</p></div>
          {plansQuery.isSuccess && <span className="plan-options-count">{plans.length} gói</span>}
        </div>
        {plansQuery.isLoading ? <LoadingState label="Đang tải danh sách gói" /> : plansQuery.isError ? <ErrorState title="Không thể tải danh sách gói" message={plansQuery.error.message} onRetry={() => plansQuery.refetch()} /> : plans.length ? (
          <div className="plan-option-grid">
            {plans.map((plan) => <PlanOptionCard key={plan.id} plan={plan} currentPlanId={currentPlanId} canCheckout={availability?.checkoutEnabled === true && currentPlanId === "free" && plan.id !== "free"} />)}
          </div>
        ) : <p className="plan-catalog-empty" role="status">Hiện chưa có gói nào được công bố.</p>}
      </section>

      {plans.length > 0 && <section className="plan-benefits-card plan-entitlement-card" aria-labelledby="plan-benefits-title">
        <div><p className="workspace-eyebrow">SO SÁNH NHANH</p><h2 id="plan-benefits-title">Quyền lợi trong gói và từng lựa chọn</h2><p>So sánh nhanh để chọn gói phù hợp với nhịp đọc của gia đình.</p></div>
        <div className="plan-benefits-list">
          {getComparisonRows(plans, availability?.source === "backend").map((row) => <div className="plan-benefit-row" key={row.label}><span>{row.label}</span>{plans.map((plan) => <span key={plan.id} className={plan.id === currentPlanId ? "is-current" : ""}>{row.get(plan)}</span>)}</div>)}
        </div>
      </section>}

    </div>
  );
}

function PlanOptionCard({ plan, currentPlanId, canCheckout }) {
  const isCurrent = plan.id === currentPlanId;
  const highlights = plan.highlights?.length ? plan.highlights : plan.limits || [];
  return <article className={`plan-option-card plan-option-card-${plan.styleKey || plan.id} ${isCurrent ? "is-current" : ""}`}>
    <div className="plan-option-topline"><span>{plan.name === "Free" ? "BẮT ĐẦU CƠ BẢN" : "GÓI SKETCHTALE"}</span>{isCurrent && <span className="plan-current-label">ĐANG SỬ DỤNG</span>}</div>
    <div className="plan-option-name"><h3>{plan.name}</h3>{isCurrent && <CheckCircle size={19} weight="fill" aria-label="Gói hiện tại" />}</div>
    <p className="plan-option-audience">{plan.audience || "Xem các quyền lợi nổi bật của gói này."}</p>
    <p className="plan-option-price">{formatPlanPrice(plan)}{getPlanPeriod(plan) && <small>{getPlanPeriod(plan)}</small>}</p>
    <ul className="plan-option-limits">{highlights.slice(0, 6).map((item) => <li key={item}><CheckCircle size={16} aria-hidden="true" />{item}</li>)}</ul>
    <div className="plan-option-action">{isCurrent ? <span className="plan-option-disabled"><CheckCircle size={16} aria-hidden="true" /> Gói hiện tại</span> : canCheckout ? <Link className="workspace-button" to={`/parent/checkout?plan=${encodeURIComponent(plan.id)}`}>Đăng ký {plan.name} <ArrowRight size={16} aria-hidden="true" /></Link> : <span className="plan-option-footnote">Thanh toán chưa khả dụng</span>}</div>
  </article>;
}

function getComparisonRows(plans, isBackendCatalog) {
  if (isBackendCatalog) return [
    { label: "Hồ sơ bé", get: (plan) => plan.profileLimit === null ? "Đang cập nhật" : `${plan.profileLimit} hồ sơ` },
    { label: "Lượt tạo mỗi tháng", get: (plan) => plan.monthlyCreditLimit === null ? "Đang cập nhật" : `${plan.monthlyCreditLimit} lượt` },
    { label: "Truy cập toàn bộ truyện", get: (plan) => typeof plan.accessFullStories === "boolean" ? (plan.accessFullStories ? "Có" : "Không") : "Đang cập nhật" },
    { label: "Tải truyện", get: (plan) => typeof plan.canExportStory === "boolean" ? (plan.canExportStory ? "Có" : "Không") : "Đang cập nhật" },
    { label: "Thời hạn", get: (plan) => plan.durationDays === null ? "Không giới hạn" : Number.isInteger(plan.durationDays) ? `${plan.durationDays} ngày` : "Đang cập nhật" },
  ];
  return [
    { label: "Hồ sơ trẻ em", get: (plan) => `${plan.profileLimit} hồ sơ` },
    { label: "Tạo nhân vật AI", get: (plan) => `${plan.generationLimit} lượt / tháng` },
    { label: "Xuất video", get: (plan) => plan.videoLimit === 0 ? "Không hỗ trợ" : plan.videoLimit === null ? "Không giới hạn" : `${plan.videoLimit} lượt / tháng` },
    { label: "Thư viện", get: (plan) => plan.id === "free" ? "5 truyện cơ bản" : plan.id === "pro" ? "Toàn bộ mẫu truyện" : "Trọn bộ cao cấp" },
  ];
}

function formatPlanPrice(plan) {
  if (plan.price === null || plan.price === undefined) return "Giá đang cập nhật";
  if (plan.price === 0) return "Miễn phí";
  const value = new Intl.NumberFormat("vi-VN").format(plan.price);
  return plan.currency === "VND" ? `${value} ₫` : value;
}

function getPlanPeriod(plan) {
  if (!plan.price) return "";
  const period = Number.isInteger(plan.durationDays) ? `${plan.durationDays} ngày` : plan.cycle === "month" ? "/ tháng" : "";
  return [!plan.currency ? "Giá đang được cập nhật" : "", period].filter(Boolean).join(" · ");
}
