import { ArrowLeft, CheckCircle, CreditCard, Info, LockKey, Package } from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router-dom";
import { plans } from "../../public/data/plans";
import "../parent-plan.css";

export default function ParentCheckoutPage() {
  const [searchParams] = useSearchParams();
  const plan = plans.find((item) => item.id === searchParams.get("plan")) || plans[1];

  return <div className="parent-checkout-page">
    <Link className="checkout-back-link" to="/parent/plan"><ArrowLeft size={16} aria-hidden="true" /> Quay lại gói sử dụng</Link>
    <header className="checkout-heading"><div><p className="workspace-eyebrow"><CreditCard size={15} aria-hidden="true" /> ĐĂNG KÝ GÓI</p><h1>Chuẩn bị thanh toán</h1><p>Kiểm tra lựa chọn của gia đình trước khi chuyển sang bước thanh toán.</p></div><span className="checkout-heading-icon"><LockKey size={25} aria-hidden="true" /></span></header>
    <div className="checkout-layout">
      <section className="checkout-placeholder-card" aria-labelledby="checkout-placeholder-title">
        <div className="checkout-placeholder-icon"><Package size={24} aria-hidden="true" /></div>
        <p className="workspace-eyebrow">THANH TOÁN</p>
        <h2 id="checkout-placeholder-title">Đăng ký gói {plan.name}</h2>
        <p>Thanh toán trực tuyến hiện chưa sẵn sàng. Bạn có thể quay lại sau để tiếp tục đăng ký.</p>
        <div className="checkout-placeholder-note" role="status"><Info size={17} aria-hidden="true" /><span>Chưa có giao dịch nào được tạo và tài khoản chưa bị tính phí.</span></div>
        <Link className="workspace-button workspace-button-quiet" to="/parent/plan">Chọn gói khác</Link>
      </section>
      <aside className="checkout-order-card" aria-labelledby="checkout-order-title">
        <p className="workspace-eyebrow">TÓM TẮT LỰA CHỌN</p>
        <h2 id="checkout-order-title">Gói {plan.name}</h2>
        <p className="checkout-order-price">{plan.price ? formatVnd(plan.price) : "Miễn phí"}<small>{plan.price ? " / tháng" : ""}</small></p>
        <ul>{plan.limits.slice(0, 4).map((item) => <li key={item}><CheckCircle size={16} aria-hidden="true" /> {item}</li>)}</ul>
        <button className="workspace-button checkout-disabled-button" type="button" disabled>Thanh toán chưa khả dụng</button>
      </aside>
    </div>
  </div>;
}

function formatVnd(value) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}
