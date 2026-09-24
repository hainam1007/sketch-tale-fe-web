import { ArrowRight, Check, Sparkle } from "@phosphor-icons/react";
import { plans } from "../../data/plans";
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

export default function PricingSection() {
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
            Bắt đầu với trải nghiệm phù hợp. Thanh toán chưa được kết nối trong
            bản thử nghiệm này.
          </Reveal>
        </div>
        <div className="landing-price-grid">
          {plans.map((plan, index) => (
            <Reveal
              key={plan.id}
              className={`landing-price-card landing-price-${plan.id} ${plan.id === "pro" ? "is-popular" : ""}`}
              delay={index * 120}
              direction="up"
            >
              {plan.id === "pro" && (
                <span className="landing-popular">
                  <Sparkle size={14} weight="fill" aria-hidden="true" /> Gói phổ
                  biến
                </span>
              )}
              <span className="landing-price-label">{labels[plan.id]}</span>
              <h3>{plan.name}</h3>
              <p>{plan.audience}</p>
              <strong className="landing-price">
                {plan.price === 0
                  ? "Miễn phí"
                  : `${new Intl.NumberFormat("vi-VN").format(plan.price)}đ`}
                <small>{plan.price > 0 ? "/ tháng" : ""}</small>
              </strong>
              <ul>
                {highlights[plan.id].map((highlight) => (
                  <li key={highlight}>
                    <Check size={17} aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>
              <a href="#pricing" className="landing-price-link">
                Xem chi tiết gói <ArrowRight size={17} aria-hidden="true" />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
