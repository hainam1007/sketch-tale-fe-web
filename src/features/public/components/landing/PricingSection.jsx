import { ArrowRight, Check, Sparkle } from "@phosphor-icons/react";
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
          <Reveal as="p" delay={200} direction="left">
            Bắt đầu với trải nghiệm phù hợp. Thanh toán chưa được kết nối trong bản thử nghiệm này.
          </Reveal>
        </div>
        {loading ? <div className="landing-pricing-state" role="status">Đang tải các gói hiện có…</div> : error ? <div className="landing-pricing-state" role="alert"><p>Chưa thể tải thông tin gói. Thử lại sau giây lát.</p><button type="button" className="landing-price-link" onClick={onRetry}>Tải lại <ArrowRight size={17} aria-hidden="true" /></button></div> : !ready ? <div className="landing-pricing-state" role="status">Hiện chưa có gói nào được công bố.</div> : <div className="landing-price-grid">
          {plans.map((plan, index) => (
            <Reveal
              key={plan.id}
              className={`landing-price-card landing-price-${plan.styleKey || plan.id} ${plan.id === "pro" ? "is-popular" : ""}`}
              delay={index * 120}
              direction="up"
            >
              {plan.id === "pro" && (
                <span className="landing-popular">
                  <Sparkle size={14} weight="fill" aria-hidden="true" /> Gói phổ
                  biến
                </span>
              )}
              <span className="landing-price-label">{labels[plan.id] || "Gói SketchTale"}</span>
              <h3>{plan.name}</h3>
              <p>{plan.audience || "Quyền lợi theo cấu hình hiện tại của gói."}</p>
              <strong className="landing-price">
                {plan.price === 0
                  ? "Miễn phí"
                  : plan.price === null || plan.price === undefined
                    ? "Chưa có giá"
                    : `${plan.currency === "VND" ? `${new Intl.NumberFormat("vi-VN").format(plan.price)} ₫` : new Intl.NumberFormat("vi-VN").format(plan.price)}`}
                <small>{plan.price > 0 ? [!plan.currency ? "Đơn vị giá chưa xác định" : "", plan.durationDays ? `${plan.durationDays} ngày` : plan.cycle === "month" ? "/ tháng" : ""].filter(Boolean).join(" · ") : ""}</small>
              </strong>
              <ul>
                {(plan.highlights?.length ? plan.highlights : highlights[plan.id] || plan.limits || []).map((highlight) => (
                  <li key={highlight}>
                    <Check size={17} aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>
              <Link to="/auth/register" className="landing-price-link">Tạo tài khoản <ArrowRight size={17} aria-hidden="true" /></Link>
            </Reveal>
          ))}
        </div>}
        {availability?.message && ready && <p className="landing-pricing-note" role="note">{availability.message}</p>}
      </div>
    </section>
  );
}
