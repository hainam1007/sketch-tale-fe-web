import {
  ArrowRight,
  ArrowCounterClockwise,
  BookOpen,
  WarningCircle,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
export function ActionLink({
  to = "/#stories",
  children = "Khám phá truyện",
  secondary = false,
  dark = false,
}) {
  return (
    <Link
      className={`button ${secondary ? "secondary" : ""} ${dark ? "dark" : ""}`}
      to={to}
    >
      {children}
      <ArrowRight size={19} aria-hidden="true" />
    </Link>
  );
}
export function SectionHeading({ label, title, children }) {
  return (
    <div className="section-heading">
      {label && <span className="eyebrow">{label}</span>}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
export function PageIntro({ label, title, children }) {
  return (
    <div className="page-intro">
      {label && <span className="eyebrow">{label}</span>}
      <h1>{title}</h1>
      {children && <p className="lead">{children}</p>}
    </div>
  );
}
export function DataState({ loading, error, retry }) {
  if (loading)
    return (
      <div className="loading-state" role="status">
        <div className="skeleton" />
        <p>Đang mở những trang sách…</p>
      </div>
    );
  if (error)
    return (
      <div className="empty-state" role="alert">
        <WarningCircle size={38} />
        <h2>Chưa tải được nội dung mẫu.</h2>
        <p>Bạn thử lại nhé.</p>
        <button className="button secondary" onClick={retry}>
          <ArrowCounterClockwise size={18} />
          Thử lại
        </button>
      </div>
    );
  return null;
}
export function FinalCta() {
  return (
    <section className="final-cta">
      <div className="container final-inner">
        <div>
          <span className="eyebrow">Mỗi ngày, một chút thời gian bên nhau</span>
          <h2>Cùng bé mở câu chuyện đầu tiên.</h2>
          <p>
            Bắt đầu bằng một câu chuyện nhỏ, dành thời gian khám phá cùng nhau.
          </p>
          <ActionLink dark />
        </div>
        <BookOpen
          className="cta-book"
          size={150}
          weight="duotone"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
