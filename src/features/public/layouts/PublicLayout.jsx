import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight, List, X } from "@phosphor-icons/react";
import BrandLogo from "../../../components/branding/BrandLogo";

const navigation = [
  ["/#features", "Cách hoạt động"],
  ["/#stories", "Truyện"],
  ["/#parents", "Dành cho phụ huynh"],
  ["/#pricing", "Bảng giá"],
];
const landingNavigation = [
  ["#features", "Tính năng"],
  ["#stories", "Truyện"],
  ["#parents", "Dành cho phụ huynh"],
  ["#pricing", "Bảng giá"],
];
export default function PublicLayout() {
  const [menuLocation, setMenuLocation] = useState(null);
  const menuButton = useRef(null);
  const menu = useRef(null);
  const location = useLocation();
  const landing = location.pathname === "/";
  const currentNavigation = landing ? landingNavigation : navigation;
  const open = menuLocation === location.key;
  const setOpen = (value) => setMenuLocation(value ? location.key : null);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector("a")?.focus();
    function onKey(event) {
      if (event.key === "Escape") {
        setMenuLocation(null);
        menuButton.current?.focus();
      }
      if (event.key === "Tab") {
        const links = [...menu.current.querySelectorAll("a")];
        if (event.shiftKey && document.activeElement === links[0]) {
          event.preventDefault();
          menuButton.current.focus();
        } else if (!event.shiftKey && document.activeElement === links.at(-1)) {
          event.preventDefault();
          menuButton.current.focus();
        } else if (document.activeElement === menuButton.current) {
          event.preventDefault();
          (event.shiftKey ? links.at(-1) : links[0]).focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <a className="skip-link" href="#main">
        Bỏ qua điều hướng
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="SketchTale - Trang chủ">
            <BrandLogo />
          </Link>
          <Link className="login-link" to="/auth/login">
            Đăng nhập <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <button
            className="menu-button"
            ref={menuButton}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={26} /> : <List size={26} />}
          </button>
        </div>
        <nav
          id="mobile-menu"
          className="mobile-nav"
          ref={menu}
          aria-label="Điều hướng di động"
          hidden={!open}
        >
          {[
            ...currentNavigation,
            ...(landing ? [["#character", "Bắt đầu ngay"]] : []),
            ["/auth/login", "Đăng nhập"],
          ].map(([to, label]) =>
            landing && to.startsWith("#") ? (
              <a key={to} href={to} onClick={() => setOpen(false)}>
                {label}
              </a>
            ) : (
              <Link key={to} to={to} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ),
          )}
        </nav>
      </header>
      <div className={landing ? "landing-scroll" : undefined}>
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className={`site-footer ${landing ? "site-footer-landing" : ""}`}>
          {landing && (
            <div className="container footer-landing-lead">
              <div>
                <span className="footer-landing-kicker">MỞ THÊM MỘT TRANG CÙNG BÉ</span>
                <h2>Biến nét vẽ hôm nay thành ký ức mai sau.</h2>
                <p>Mỗi câu chuyện bắt đầu từ một ý tưởng nhỏ của bé.</p>
              </div>
              <a className="footer-landing-cta" href="#character">
                Bắt đầu sáng tạo <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          )}
          <div className="container footer-grid">
            <div className="footer-brand">
              <Link to="/" className="brand">
                <BrandLogo />
              </Link>
              <p>
                Cùng bé mở trang sách,
                <br />
                nuôi dưỡng trí tưởng tượng.
              </p>
            </div>
            <div>
              <h2>Khám phá</h2>
              {landing ? (
                <>
                  <a href="#stories">Truyện</a>
                  <a href="#parents">Dành cho phụ huynh</a>
                  <a href="#pricing">Bảng giá</a>
                </>
              ) : (
                <>
                  <Link to="/#stories">Truyện</Link>
                  <Link to="/#parents">Dành cho phụ huynh</Link>
                  <Link to="/#pricing">Bảng giá</Link>
                </>
              )}
              <Link to="/about">Về SketchTale</Link>
            </div>
            <div>
              <h2>Hỗ trợ</h2>
              <Link to="/faq">Câu hỏi thường gặp</Link>
              <Link to="/contact">Liên hệ</Link>
              <Link to="/child-safety">Đồng hành cùng bé</Link>
            </div>
            <div>
              <h2>Chính sách</h2>
              <Link to="/privacy">Quyền riêng tư (bản nháp)</Link>
              <Link to="/terms">Điều khoản (bản nháp)</Link>
              <p className="small">Nội dung chính sách đang được hoàn thiện.</p>
            </div>
          </div>
          <div className="container footer-bottom">
            <span>SketchTale</span>
            <span>Một câu chuyện nhỏ. Một khoảng thời gian bên nhau.</span>
          </div>
        </footer>
      </div>
    </>
  );
}
