import { ArrowRight, CheckCircle, Crown, Package } from "@phosphor-icons/react";
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
            <Package size={15} aria-hidden="true" /> PHỤ HUYNH / GÓI VÀ HẠN MỨC
          </p>
          <h1>Gói sử dụng</h1>
        </div>
        <span className="plan-heading-icon" aria-hidden="true">
          <Package size={27} />
        </span>
      </header>

      <section
        className="plan-current-card plan-summary-primary plan-current-card-unavailable"
        aria-labelledby="plan-options-title"
      >
        <div className="plan-current-main">
          <div className="plan-current-kicker">LỰA CHỌN CHO GIA ĐÌNH</div>
          <h2 id="plan-options-title">Chọn gói phù hợp với nhịp đọc</h2>
          <p>So sánh quyền lợi và hạn mức của từng gói dành cho gia đình.</p>
        </div>
        {plansQuery.isSuccess && (
          <span className="plan-options-count plan-options-intro-count">
            {plans.length} gói
          </span>
        )}
      </section>

      <section
        className="plan-options-section"
        id="plan-options"
        aria-labelledby="plan-options-title"
      >
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
  const isFeatured = String(plan.name || "").trim().toLowerCase() === "plus";
  const configuredHighlights = plan.highlights?.length
    ? plan.highlights
    : plan.limits || [];
  const highlights = configuredHighlights.filter(
    (item) => {
      const normalizedItem = item.trim().toLowerCase();
      const isPlaceholderFreeDuration =
        plan.price === 0 && normalizedItem === "thời hạn 9999 ngày";
      const isSevenDayTrial = normalizedItem === "dùng thử 7 ngày";
      return !isPlaceholderFreeDuration && !isSevenDayTrial;
    },
  );
  return (
    <article
      className={`plan-option-card plan-option-card-${plan.styleKey || plan.id} ${isFeatured ? "plan-option-card-plus" : ""} ${isCurrent ? "is-current" : ""}`}
    >
      <div className="plan-option-topline">
        <span>
          {plan.name === "Free" ? "BẮT ĐẦU CƠ BẢN" : "GÓI SKETCHTALE"}
        </span>
        {isFeatured && (
          <span className="plan-option-highlight-badge" title="Gói Plus">
            <Crown size={16} weight="fill" aria-hidden="true" />
          </span>
        )}
        {isCurrent && <span className="plan-current-label">ĐANG SỬ DỤNG</span>}
      </div>
      <div className="plan-option-name">
        <h3>{plan.name}</h3>
        {isCurrent && (
          <CheckCircle size={19} weight="fill" aria-label="Gói hiện tại" />
        )}
      </div>
      <p className="plan-option-audience">
        {getPlanDescription(plan)}
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

function getPlanDescription(plan) {
  const audience = plan.audience?.trim();
  if (
    audience &&
    audience !== "Quyền lợi theo cấu hình hiện tại của gói."
  ) {
    return audience;
  }
  if (plan.price === 0) {
    return "Bắt đầu miễn phí, cùng bé khám phá truyện.";
  }
  if (plan.profileLimit >= 5) {
    return "Nhiều hồ sơ và credit hơn để cả gia đình cùng khám phá.";
  }
  if (plan.accessFullStories && plan.canExportStory) {
    return "Đọc toàn bộ truyện và lưu lại những câu chuyện của bé.";
  }
  return "Thêm credit để bé đọc truyện và sáng tạo nhiều hơn.";
}

function formatPlanPrice(plan) {
  if (plan.price === null || plan.price === undefined)
    return "Giá đang cập nhật";
  if (plan.price === 0) return "Miễn phí";
  const amount =
    plan.currency === "VND" || plan.price >= 1000
      ? plan.price
      : plan.price * 1000;
  const value = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `đ${value}`;
}

function getPlanPeriod(plan) {
  if (!plan.price) return "";
  if (Number.isInteger(plan.durationDays)) {
    return plan.durationDays === 30
      ? "/tháng"
      : `/${plan.durationDays} ngày`;
  }
  return plan.cycle === "month" ? "/tháng" : "";
}
