import { ArrowRight, Check } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";

const labels = {
  free: "Bắt đầu nhẹ nhàng",
  pro: "Sáng tạo mỗi ngày",
  family: "Cho cả gia đình",
};
const highlights = {
  free: [
    "1 hồ sơ trẻ em",
    "5 lượt tạo nhân vật AI / tháng",
    "1 lần tạo lại mỗi bức tranh",
    "5 truyện miễn phí",
    "Không hỗ trợ xuất video",
  ],
  pro: [
    "Tối đa 3 hồ sơ trẻ em",
    "30 lượt tạo nhân vật AI / tháng",
    "1 lần tạo lại mỗi bức tranh",
    "Mở toàn bộ thư viện truyện",
    "5 lượt xuất video / tháng",
  ],
  family: [
    "Tối đa 5 hồ sơ trẻ em",
    "100 lượt tạo nhân vật AI / tháng",
    "1 lần tạo lại mỗi bức tranh",
    "Truyện cao cấp + cập nhật hàng tuần",
    "Xuất video không giới hạn",
  ],
};

const fallbackAudiences = [
  "Quyền lợi theo cấu hình hiện tại của gói.",
  "Gói SketchTale",
];

function getPlanEmphasis(plan, entries) {
  const audience = plan.audience?.trim();
  if (audience && !fallbackAudiences.includes(audience)) {
    return { description: audience, emphasized: [] };
  }

  const emphasized = [];
  const findHighlight = (predicate) => entries.find((entry) => predicate(entry));
  const profileHighlight = Number.isInteger(plan.profileLimit)
    ? findHighlight((entry) => entry.toLowerCase().includes("hồ sơ"))
    : null;
  const creditHighlight = Number.isInteger(plan.monthlyCreditLimit)
    ? findHighlight((entry) => entry.toLowerCase().includes("credit"))
    : null;

  if (profileHighlight) emphasized.push(profileHighlight);
  if (creditHighlight && creditHighlight !== profileHighlight) {
    emphasized.push(creditHighlight);
  }
  if (!emphasized.length && entries.length) emphasized.push(entries[0]);

  return {
    description: emphasized.length
      ? emphasized.join(" · ")
      : "Quyền lợi theo dữ liệu gói hiện có.",
    emphasized,
  };
}

function formatPlanPeriod(plan) {
  if (Number.isInteger(plan.durationDays) && plan.durationDays > 0) {
    return `${plan.durationDays} ngày`;
  }
  if (plan.cycle === "month") return "Theo tháng";
  if (plan.price > 0) return "Thời hạn chưa được công bố";
  return "";
}

function formatPlanPrice(plan) {
  if (plan.price === 0) return "Miễn phí";
  if (plan.price === null || plan.price === undefined) return "Chưa có giá";
  if (!plan.currency) {
    return `${new Intl.NumberFormat("vi-VN").format(plan.price)} · Chưa rõ đơn vị tiền`;
  }
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: plan.currency,
      maximumFractionDigits: 0,
    }).format(plan.price);
  } catch {
    return `${new Intl.NumberFormat("vi-VN").format(plan.price)} ${plan.currency}`;
  }
}

export default function PricingSection({ availability, loading, error, onRetry }) {
  const plans = availability?.plans || [];
  const ready = !loading && !error && availability?.published && plans.length > 0;

  return (
    <section
      className="landing-section landing-pricing-section"
      id="pricing"
      aria-labelledby="pricing-title"
    >
      <div className="landing-container">
        <div className="landing-section-heading">
          <Reveal as="span" className="landing-kicker" direction="left">
            Một gói phù hợp cho mỗi khởi đầu
          </Reveal>
          <Reveal as="h2" id="pricing-title" delay={100} direction="left">
            Chọn chương tiếp theo
            <br />
            <em>cho gia đình.</em>
          </Reveal>
        </div>
        {loading ? (
          <div className="landing-pricing-state" role="status">
            Đang tải các gói hiện có…
          </div>
        ) : error ? (
          <div className="landing-pricing-state" role="alert">
            <p>Chưa thể tải thông tin gói. Thử lại sau giây lát.</p>
            <button
              type="button"
              className="landing-price-link"
              onClick={onRetry}
            >
              Tải lại <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        ) : !ready ? (
          <div className="landing-pricing-state" role="status">
            Hiện chưa có gói nào được công bố.
          </div>
        ) : (
          <div className="landing-price-grid">
            {plans.map((plan, index) => {
              const entries = plan.highlights?.length
                ? plan.highlights
                : highlights[plan.id] || plan.limits || [];
              const emphasis = getPlanEmphasis(plan, entries);
              const remainingEntries = entries.filter(
                (entry) => !emphasis.emphasized.includes(entry),
              );

              return (
                <Reveal
                  key={plan.id}
                  className={`landing-price-card landing-price-${plan.styleKey || plan.id}`}
                  delay={index * 120}
                  direction="up"
                >
                  <span className="landing-price-label">
                    {labels[plan.id] || "Gói SketchTale"}
                  </span>
                  <h3>{plan.name}</h3>
                  <p>{emphasis.description}</p>
                  <strong className="landing-price">
                    {formatPlanPrice(plan)}
                    <small>{formatPlanPeriod(plan)}</small>
                  </strong>
                  <ul>
                    {remainingEntries.map((highlight) => (
                      <li key={highlight}>
                        <Check size={17} aria-hidden="true" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth/register" className="landing-price-link">
                    Tạo tài khoản <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
        {ready && availability.checkoutEnabled === false && (
          <p className="landing-pricing-note">
            Giá và thời hạn theo danh mục gói. Đăng ký gói và thanh toán chưa được bật trong bản trải nghiệm.
          </p>
        )}
      </div>
    </section>
  );
}
