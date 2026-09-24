import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Info,
  LockKey,
  Sparkle,
  Star,
} from "@phosphor-icons/react";
import "./auth.css";
import { useAuth } from "../AuthProvider";
import BrandLogo from "../../../components/branding/BrandLogo";
import { roleHome } from "../../../lib/permissions/roles";
const content = {
  login: {
    title: "Chào bố mẹ,\nmừng trở lại!",
    description: "Một chút thời gian bên nhau, thêm một câu chuyện để nhớ.",
    button: "Đăng nhập",
  },
  register: {
    title: "Cùng mở một hành trình mới.",
    description: "Tài khoản dành cho phụ huynh đồng hành cùng bé.",
    button: "Kiểm tra đăng ký",
  },
  "forgot-password": {
    title: "Tìm lại đường về kệ sách.",
    description:
      "Nhập email tài khoản phụ huynh để kiểm tra biểu mẫu đặt lại mật khẩu.",
    button: "Kiểm tra email",
  },
};
export default function AuthPage({ mode }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [submitting, setSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const form = useRef(null);
  const copy = content[mode];
  const forgot = mode === "forgot-password";
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = "Vui lòng nhập email đúng định dạng.";
    if (!forgot && values.password.length < 8)
      next.password = "Nhập ít nhất 8 ký tự để thử biểu mẫu.";
    if (mode === "register" && values.confirm !== values.password)
      next.confirm = "Hai mật khẩu chưa trùng nhau.";
    setErrors(next);
    setMessageType("success");
    setMessage(Object.keys(next).length ? "" : "");
    if (Object.keys(next).length)
      form.current.elements[Object.keys(next)[0]].focus();
    else if (mode === "login") {
      setSubmitting(true);
      try {
        const user = await login({ email: values.email, password: values.password });
        navigate(roleHome(user.role), { replace: true });
      } catch (error) {
        setMessageType("error");
        setMessage(error.message);
      } finally {
        setSubmitting(false);
      }
    } else {
      setMessage(
        forgot
          ? "Email hợp lệ. Bản demo chưa gửi email đặt lại mật khẩu."
          : "Thông tin hợp lệ. Bản demo chưa đăng nhập hoặc tạo tài khoản.",
      );
      form.current
        .querySelectorAll('input[name="password"], input[name="confirm"]')
        .forEach((input) => {
          input.value = "";
        });
      setVisiblePasswords({});
    }
  }
  return (
    <div className="container auth-story-page">
      <section className="auth-story" aria-label="Cùng bé mở trang sách">
        <Link to="/" className="auth-back">
          <ArrowLeft size={17} aria-hidden="true" /> Về trang chủ
        </Link>
        <div className="auth-story-heading">
          <span className="auth-kicker">
            <BookOpen size={18} aria-hidden="true" /> MỖI NGÀY, MỘT CÂU CHUYỆN
          </span>
          <h2>
            Mở trang sách nhỏ.
            <br />
            <span>Chạm thế giới lớn.</span>
          </h2>
        </div>
        <div className="auth-illustration">
          <span className="auth-orbit" aria-hidden="true" />
          <Star
            className="auth-star auth-star-one"
            size={34}
            weight="fill"
            aria-hidden="true"
          />
          <Sparkle
            className="auth-star auth-star-two"
            size={30}
            weight="fill"
            aria-hidden="true"
          />
          <Star
            className="auth-star auth-star-three"
            size={18}
            weight="fill"
            aria-hidden="true"
          />
          <img
            src="/images/hero.webp"
            alt="Mèo SketchTale và thỏ nhỏ cùng khám phá cuốn sách"
            width="800"
            height="600"
          />
          <span className="auth-story-note">
            <Sparkle size={17} weight="fill" aria-hidden="true" /> Trí tưởng
            tượng bắt đầu từ đây
          </span>
        </div>
        <p className="auth-story-caption">
          Một trang sách mới đang chờ bố mẹ và bé.
          <br />
          Cùng đọc, cùng cười, cùng lớn lên.
        </p>
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card-topline">
          <div className="auth-card-mark">
            <BrandLogo variant="widget" alt="Biểu tượng SketchTale" />
          </div>
          <span className="auth-kicker">GÓC CỦA BỐ MẸ</span>
        </div>
        <header className="auth-intro">
          <h1 id="auth-title">{copy.title}</h1>
          <p>{copy.description}</p>
        </header>
        <form
          ref={form}
          noValidate
          onSubmit={submit}
          onChange={() => {
            setMessage("");
            setMessageType("success");
          }}
        >
          {[
            ["email", "Email", "email"],
            ...(!forgot ? [["password", "Mật khẩu", "password"]] : []),
            ...(mode === "register"
              ? [["confirm", "Nhập lại mật khẩu", "password"]]
              : []),
          ].map(([name, label, type]) => (
            <div className="field" key={name}>
              <label htmlFor={`auth-${name}`}>{label}</label>
              <div className="auth-input-wrap">
                {name === "email" ? (
                  <EnvelopeSimple size={20} aria-hidden="true" />
                ) : (
                  <LockKey size={20} aria-hidden="true" />
                )}
                <input
                  id={`auth-${name}`}
                  name={name}
                  type={visiblePasswords[name] ? "text" : type}
                  placeholder={
                    name === "email" ? "bome@example.com" : "Ít nhất 8 ký tự"
                  }
                  autoComplete={
                    name === "email"
                      ? "email"
                      : mode === "login"
                        ? "current-password"
                        : "new-password"
                  }
                  aria-invalid={!!errors[name]}
                  aria-describedby={errors[name] ? `${name}-error` : undefined}
                />
                {type === "password" && (
                  <button
                    className="auth-password-toggle"
                    type="button"
                    aria-label={`${visiblePasswords[name] ? "Ẩn" : "Hiện"} ${name === "confirm" ? "mật khẩu xác nhận" : "mật khẩu"}`}
                    aria-pressed={!!visiblePasswords[name]}
                    onClick={() =>
                      setVisiblePasswords((current) => ({
                        ...current,
                        [name]: !current[name],
                      }))
                    }
                  >
                    {visiblePasswords[name] ? (
                      <EyeSlash size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                )}
              </div>
              {errors[name] && (
                <p id={`${name}-error`} className="field-error">
                  {errors[name]}
                </p>
              )}
            </div>
          ))}
          {mode === "login" && (
            <Link className="text-link forgot-link" to="/auth/forgot-password">
              Quên mật khẩu?
            </Link>
          )}
          <button className="button auth-submit" type="submit" disabled={submitting}>
            {copy.button}
            <ArrowRight size={20} aria-hidden="true" />
          </button>
          {mode === "login" && (
            <div className="auth-demo-accounts">
              <strong>Tài khoản demo</strong>
              <span>Parent: parent@example.com / parent123</span>
              <span>Family: family@example.com / family123</span>
              <span>Content: content@example.com / content123</span>
              <span>Admin: admin@example.com / admin123</span>
            </div>
          )}
          <div role="status">
            {message && <p className={`${messageType === "error" ? "auth-error-message" : "success-message"}`}>{message}</p>}
          </div>
        </form>
        <p className="auth-alternate">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <Link to="/auth/register">Xem mẫu đăng ký</Link>
            </>
          ) : (
            <Link to="/auth/login">Quay lại đăng nhập</Link>
          )}
        </p>
        <p className="auth-demo-note">
          <Info size={18} aria-hidden="true" />
          <span>{mode === "login" ? "Phiên đăng nhập đang dùng mock API và chỉ dành cho demo. Không dùng mật khẩu thật." : "Bản trải nghiệm, chưa tạo tài khoản thật. Bố mẹ hãy dùng thông tin thử, không dùng mật khẩu thật."}</span>
        </p>
      </section>
    </div>
  );
}
