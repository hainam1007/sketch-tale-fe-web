import {
  ArrowRight,
  CheckCircle,
  Info,
  Package,
  Sparkle,
  UsersThree,
  VideoCamera,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { plans } from "../../public/data/plans";
import "../parent-plan.css";

const planTone = { Free: "free", Pro: "pro", Family: "family" };

export default function ParentPlanPage() {
  const { user } = useAuth();
  const entitlementQuery = useQuery({
    queryKey: queryKeys.entitlement(user.id),
    queryFn: ({ signal }) => childrenService.entitlement({ signal }),
  });

  if (entitlementQuery.isLoading) return <LoadingState label="Đang tải gói và hạn mức" />;
  if (entitlementQuery.isError) {
    return <ErrorState title="Không thể tải thông tin gói" message={entitlementQuery.error.message} onRetry={() => entitlementQuery.refetch()} />;
  }

  const entitlement = entitlementQuery.data;
  const currentPlan = plans.find((plan) => plan.name === entitlement.plan) || plans[0];
  const currentPlanId = currentPlan.id;
  const profileUsage = getProfileUsage(entitlement);
  const hasPaidPlan = currentPlanId !== "free";
  const expiresAt = entitlement.expiresAt || entitlement.subscription?.expiresAt;
  const subscriptionStatus = entitlement.subscriptionStatus || entitlement.subscription?.status || "active";

  return (
    <div className="parent-plan-page">
      <header className="plan-page-heading">
        <div>
          <p className="workspace-eyebrow"><Package size={15} aria-hidden="true" /> GÓI VÀ HẠN MỨC</p>
          <h1>Gói đang đồng hành cùng gia đình</h1>
          <p>Xem quyền đang có, theo dõi hạn mức và chọn gói phù hợp với gia đình.</p>
        </div>
        <span className="plan-heading-icon" aria-hidden="true"><Package size={27} /></span>
      </header>

      <section className={`plan-current-card plan-summary-primary plan-current-card-${planTone[entitlement.plan] || "free"}`} aria-labelledby="current-plan-title">
        <div className="plan-current-main">
          <div className="plan-current-kicker">GÓI ĐANG SỬ DỤNG</div>
          <div className="plan-current-title-row">
            <h2 id="current-plan-title">{entitlement.plan}</h2>
            <StatusBadge value="active" tone="success" label={hasPaidPlan ? "Đang hoạt động" : "Miễn phí"} />
          </div>
          <p>{hasPaidPlan ? `Quyền lợi ${entitlement.plan} đang được áp dụng cho tài khoản này.` : "Bạn đang dùng quyền lợi cơ bản để bắt đầu cùng bé."}</p>
          <div className="plan-current-actions">
            <Link className="workspace-button workspace-button-quiet plan-secondary-action" to="/parent/children">
              Quản lý hồ sơ bé <ArrowRight size={16} aria-hidden="true" />
            </Link>
            {!hasPaidPlan && <a className="workspace-button plan-primary-action" href="#plan-options">Xem gói trả phí <ArrowRight size={16} aria-hidden="true" /></a>}
          </div>
        </div>
        <dl className="plan-current-meta">
          <div>
            <dt>Hiệu lực gói</dt>
            <dd>{hasPaidPlan ? formatSubscriptionDate(expiresAt) : "Không áp dụng với Free"}</dd>
            {hasPaidPlan && !expiresAt && <small>Chưa có thông tin thời hạn từ tài khoản.</small>}
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>{subscriptionStatus === "active" ? "Đang hoạt động" : getSubscriptionLabel(subscriptionStatus)}</dd>
            <small>{entitlement.timezone ? timezoneLabel(entitlement.timezone) : "Múi giờ chưa được cung cấp"}</small>
          </div>
        </dl>
      </section>

      <section className="plan-usage-section" aria-labelledby="plan-usage-title">
        <div className="plan-section-heading">
          <div>
            <p className="workspace-eyebrow">THEO DÕI QUYỀN ĐANG DÙNG</p>
            <h2 id="plan-usage-title">Hạn mức của tài khoản</h2>
          </div>
          <span className="plan-section-note"><Info size={15} aria-hidden="true" /> Ngày reset khác với ngày hết hạn gói</span>
        </div>
        <div className="plan-usage-grid">
          <UsageCard icon={UsersThree} label="Hồ sơ bé" value={profileUsage.value} detail={profileUsage.detail} progress={profileUsage.progress} link={{ to: "/parent/children", label: "Quản lý hồ sơ" }} valueClassName="plan-stat-value" />
          <UsageCard icon={Sparkle} label="Tạo nhân vật AI" value={formatUsage(entitlement.generationUsed, entitlement.generationLimit)} detail={getUsageDetail(entitlement.generationResetAt || entitlement.resetAt, entitlement.timezone)} />
          <UsageCard icon={VideoCamera} label="Xuất video" value={formatVideoUsage(entitlement.videoUsed, entitlement.videoLimit, currentPlan)} detail="Theo quyền lợi của gói hiện tại" />
        </div>
      </section>

      <section className="plan-options-section" id="plan-options" aria-labelledby="plan-options-title">
        <div className="plan-section-heading plan-options-heading">
          <div>
            <p className="workspace-eyebrow">LỰA CHỌN CHO GIA ĐÌNH</p>
            <h2 id="plan-options-title">Chọn gói phù hợp với nhịp đọc</h2>
            <p>Giá theo tháng. Bạn chỉ đăng ký gói mới khi tài khoản đủ điều kiện theo chính sách.</p>
          </div>
          <span className="plan-options-count">{plans.length} gói</span>
        </div>
        <div className="plan-option-grid">
          {plans.map((plan) => <PlanOptionCard key={plan.id} plan={plan} currentPlanId={currentPlanId} canCheckout={currentPlanId === "free" && plan.id !== "free"} />)}
        </div>
      </section>

      <section className="plan-benefits-card plan-entitlement-card" aria-labelledby="plan-benefits-title">
        <div>
          <p className="workspace-eyebrow">SO SÁNH NHANH</p>
          <h2 id="plan-benefits-title">Quyền lợi trong gói và từng lựa chọn</h2>
          <p>Hạn mức và quyền truy cập bên dưới lấy từ catalog sản phẩm. Quyền thực tế vẫn do tài khoản trả về.</p>
        </div>
        <div className="plan-benefits-list">
          {comparisonRows.map((row) => <div className="plan-benefit-row" key={row.label}><span>{row.label}</span>{plans.map((plan) => <span key={plan.id} className={plan.id === currentPlanId ? "is-current" : ""}>{row.get(plan)}</span>)}</div>)}
        </div>
      </section>

      <div className="plan-help-note" role="note"><Info size={17} aria-hidden="true" /><span>Ngày đặt lại lượt AI chỉ áp dụng cho hạn mức sử dụng. Nếu tài khoản chưa trả về ngày hết hạn, trang sẽ giữ trạng thái “Chưa có thông tin” và không tự suy đoán.</span></div>
    </div>
  );
}

function UsageCard({ icon: Icon, label, value, detail, progress, link, valueClassName = "" }) {
  return <article className="plan-usage-card"><div className="plan-usage-icon"><Icon size={20} aria-hidden="true" /></div><div className="plan-usage-copy"><span>{label}</span><strong className={valueClassName}>{value}</strong><small>{detail}</small>{progress !== undefined && <div className="plan-usage-progress" role="progressbar" aria-valuenow={progress.used} aria-valuemin="0" aria-valuemax={progress.limit} aria-label={`${label}: ${progress.used} trên ${progress.limit}`}><span style={{ width: `${progress.percent}%` }} /></div>}{link && <Link to={link.to}>{link.label} <ArrowRight size={14} aria-hidden="true" /></Link>}</div></article>;
}

function PlanOptionCard({ plan, currentPlanId, canCheckout }) {
  const isCurrent = plan.id === currentPlanId;
  return <article className={`plan-option-card plan-option-card-${plan.id} ${isCurrent ? "is-current" : ""}`}>
    <div className="plan-option-topline"><span>{plan.name === "Pro" ? "CHO GIA ĐÌNH 1–2 BÉ" : plan.id === "free" ? "BẮT ĐẦU CƠ BẢN" : "NHIỀU KHÔNG GIAN HƠN"}</span>{isCurrent && <span className="plan-current-label">ĐANG SỬ DỤNG</span>}</div>
    <div className="plan-option-name"><h3>{plan.name}</h3>{isCurrent && <CheckCircle size={19} weight="fill" aria-label="Gói hiện tại" />}</div>
    <p className="plan-option-audience">{plan.audience}</p>
    <p className="plan-option-price">{plan.price ? formatVnd(plan.price) : "Miễn phí"}{plan.price > 0 && <small>/ tháng</small>}</p>
    <ul className="plan-option-limits">{plan.limits.slice(0, 5).map((item) => <li key={item}><CheckCircle size={16} aria-hidden="true" />{item}</li>)}</ul>
    <div className="plan-option-action">{isCurrent ? <span className="plan-option-disabled"><CheckCircle size={16} aria-hidden="true" /> Gói hiện tại</span> : canCheckout ? <Link className="workspace-button" to={`/parent/checkout?plan=${plan.id}`}>Đăng ký {plan.name} <ArrowRight size={16} aria-hidden="true" /></Link> : <span className="plan-option-footnote">Chọn từ tài khoản Free</span>}</div>
  </article>;
}

const comparisonRows = [
  { label: "Hồ sơ trẻ em", get: (plan) => `${plan.profileLimit} hồ sơ` },
  { label: "Tạo nhân vật AI", get: (plan) => `${plan.generationLimit} lượt / tháng` },
  { label: "Xuất video", get: (plan) => plan.videoLimit === 0 ? "Không hỗ trợ" : plan.videoLimit === null ? "Không giới hạn" : `${plan.videoLimit} lượt / tháng` },
  { label: "Thư viện", get: (plan) => plan.id === "free" ? "5 truyện cơ bản" : plan.id === "pro" ? "Toàn bộ mẫu truyện" : "Trọn bộ cao cấp" },
];

function getProfileUsage(entitlement) {
  const limit = entitlement.childProfileLimit;
  const used = entitlement.usedChildProfiles ?? 0;
  if (limit === null || limit === undefined) return { value: `${used} / ∞`, detail: "Không giới hạn theo gói hiện tại" };
  const remaining = Math.max(0, limit - used);
  return { value: `${used} / ${limit}`, detail: remaining ? `Còn ${remaining} hồ sơ có thể tạo` : "Đã dùng hết hạn mức hồ sơ", progress: { used, limit, percent: Math.min(100, used / limit * 100) } };
}

function formatUsage(used, limit) {
  if (used === undefined || limit === undefined || limit === null) return "Chưa có dữ liệu";
  return `${used} / ${limit}`;
}

function formatVideoUsage(used, limit, plan) {
  if (plan.videoLimit === 0) return "Không có trong gói";
  if (used === undefined || limit === undefined) return plan.videoLimit === null ? "Không giới hạn" : "Chưa có dữ liệu";
  return limit === null ? `${used} / ∞` : `${used} / ${limit}`;
}

function getUsageDetail(resetAt, timezone) {
  return resetAt ? `Đặt lại ${formatDate(resetAt)} · ${timezoneLabel(timezone)}` : "Kỳ reset chưa được cung cấp";
}

function formatSubscriptionDate(value) {
  return value ? `Đến ${formatDate(value)}` : "Chưa có thông tin";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

function formatVnd(value) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function timezoneLabel(value) {
  if (!value) return "Múi giờ chưa được cung cấp";
  return value === "Asia/Ho_Chi_Minh" ? "Giờ Việt Nam" : value;
}

function getSubscriptionLabel(value) {
  return { pending: "Đang kích hoạt", expired: "Đã hết hạn", past_due: "Cần xử lý thanh toán" }[value] || "Chưa xác định";
}
