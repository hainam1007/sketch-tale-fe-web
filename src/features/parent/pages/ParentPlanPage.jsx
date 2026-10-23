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
          <p className="workspace-eyebrow">
            <Package size={15} aria-hidden="true" /> GÓI VÀ HẠN MỨC
          </p>
          <h1>Gói đang đồng hành cùng gia đình</h1>
          <p>Xem các gói và quyền lợi dành cho gia đình.</p>
        </div>
        <span className="plan-heading-icon" aria-hidden="true">
          <Package size={27} />
        </span>
      </header>

      <section
        className="plan-current-card plan-summary-primary plan-current-card-unavailable"
        aria-labelledby="current-plan-title"
      >
        <div className="plan-current-main">
          <div className="plan-current-kicker">GÓI CỦA GIA ĐÌNH</div>
          <h2 id="current-plan-title">Trải nghiệm đăng ký gói cho gia đình</h2>
          <p>
            Chọn một gói để thử luồng thanh toán demo. Không thu tiền hoặc thay
            đổi gói thật.
          </p>
        </div>
      </section>

      <section
        className="plan-options-section"
        id="plan-options"
        aria-labelledby="plan-options-title"
      >
        <div className="plan-section-heading plan-options-heading">
          <div>
            <p className="workspace-eyebrow">LỰA CHỌN CHO GIA ĐÌNH</p>
            <h2 id="plan-options-title">Chọn gói phù hợp với nhịp đọc</h2>
            <p>So sánh quyền lợi và hạn mức của từng gói dành cho gia đình.</p>
          </div>
          {plansQuery.isSuccess && (
            <span className="plan-options-count">{plans.length} gói</span>
          )}
        </div>
        {plansQuery.isLoading ? (
          <LoadingState label="Đang tải danh sách gói" />
        ) : plansQuery.isError ? (
          <ErrorState
            title="Không thể tải danh sách gói"
            message={plansQuery.error.message}
            onRetry={() => plansQuery.refetch()}
          />
        ) : plans.length ? (
          <div className="plan-option-grid">
            {plans.map((plan) => (
              <PlanOptionCard
                key={plan.id}
                plan={plan}
                currentPlanId={currentPlanId}
                canCheckout={true}
              />
            ))}
          </div>
        ) : (
          <p className="plan-catalog-empty" role="status">
            Hiện chưa có gói nào được công bố.
          </p>
        )}
      </section>
    </div>
  );
}

function PlanOptionCard({ plan, currentPlanId, canCheckout }) {
  const isCurrent = plan.id === currentPlanId;
  const highlights = plan.highlights?.length
    ? plan.highlights
    : plan.limits || [];
  return (
    <article
      className={`plan-option-card plan-option-card-${plan.styleKey || plan.id} ${isCurrent ? "is-current" : ""}`}
    >
      <div className="plan-option-topline">
        <span>
          {plan.name === "Free" ? "BẮT ĐẦU CƠ BẢN" : "GÓI SKETCHTALE"}
        </span>
        {isCurrent && <span className="plan-current-label">ĐANG SỬ DỤNG</span>}
      </div>
      <div className="plan-option-name">
        <h3>{plan.name}</h3>
        {isCurrent && (
          <CheckCircle size={19} weight="fill" aria-label="Gói hiện tại" />
        )}
      </div>
      <p className="plan-option-audience">
        {plan.audience || "Xem các quyền lợi nổi bật của gói này."}
      </p>
      <p className="plan-option-price">
        {formatPlanPrice(plan)}
        {getPlanPeriod(plan) && <small>{getPlanPeriod(plan)}</small>}
      </p>
      <ul className="plan-option-limits">
        {highlights.slice(0, 6).map((item) => (
          <li key={item}>
            <CheckCircle size={16} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <div className="plan-option-action">
        {isCurrent ? (
          <span className="plan-option-disabled">
            <CheckCircle size={16} aria-hidden="true" /> Gói hiện tại
          </span>
        ) : canCheckout ? (
          <Link
            className="workspace-button"
            to={`/parent/checkout?plan=${encodeURIComponent(plan.id)}`}
            state={{ plan }}
          >
            Chọn {plan.name} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <span className="plan-option-footnote">Thanh toán chưa khả dụng</span>
        )}
      </div>
    </article>
  );
}

function formatPlanPrice(plan) {
  if (plan.price === null || plan.price === undefined)
    return "Giá đang cập nhật";
  if (plan.price === 0) return "Miễn phí";
  const value = new Intl.NumberFormat("vi-VN").format(plan.price);
  return plan.currency === "VND" ? `${value} ₫` : value;
}

function getPlanPeriod(plan) {
  if (!plan.price) return "";
  const period = Number.isInteger(plan.durationDays)
    ? `${plan.durationDays} ngày`
    : plan.cycle === "month"
      ? "/ tháng"
      : "";
  return [!plan.currency ? "Giá đang được cập nhật" : "", period]
    .filter(Boolean)
    .join(" · ");
}
