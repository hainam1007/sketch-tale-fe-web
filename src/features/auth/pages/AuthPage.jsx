import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  LockKey,
  Sparkle,
  Star,
  UserCircle,
} from "@phosphor-icons/react";
import "./auth.css";
import { useAuth } from "../AuthProvider";
import { authService, isRealApi } from "../authService";
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
    button: "Đăng ký",
  },
  "forgot-password": {
    title: "Tìm lại đường về kệ sách.",
    description:
      "Nhập email tài khoản phụ huynh để kiểm tra biểu mẫu đặt lại mật khẩu.",
    button: "Kiểm tra email",
  },
};
export default function AuthPage({ mode }) {
  const { login, status, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(() => mode === "login" && searchParams.get("passwordChanged") === "1" ? "Mật khẩu đã được cập nhật. Đăng nhập lại bằng mật khẩu mới." : "");
  const [messageType, setMessageType] = useState("success");
  const [submitting, setSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const form = useRef(null);
  const copy = content[mode];
  const forgot = mode === "forgot-password";

  useEffect(() => {
    if (mode === "login" && status === "authenticated" && user) {
      navigate(roleHome(user.role), { replace: true });
    }
  }, [mode, navigate, status, user]);

  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const next = {};
    if (isRealApi && mode === "register" && !values.username?.trim())
      next.username = "Vui lòng nhập tên tài khoản.";
    if (mode === "login") {
      if (!values.identifier?.trim()) next.identifier = "Nhập email hoặc tên tài khoản.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = "Vui lòng nhập email đúng định dạng.";
    }
    const minimumPasswordLength = mode === "register" ? (isRealApi ? 6 : 8) : 0;
    if (!forgot && (!values.password || values.password.length < minimumPasswordLength))
      next.password = mode === "login" ? "Nhập mật khẩu." : `Mật khẩu cần có ít nhất ${minimumPasswordLength} ký tự.`;
    if (isRealApi && mode === "register" && values.password && !/(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(values.password))
      next.password = "Mật khẩu cần có chữ hoa, chữ số và ký tự đặc biệt.";
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
        const user = await login({
          email: values.identifier.trim(),
          password: values.password,
        });
        navigate(roleHome(user.role), { replace: true });
      } catch (error) {
        setMessageType("error");
        setMessage(error.message);
      } finally {
        setSubmitting(false);
      }
    } else if (isRealApi && mode === "register") {
      setSubmitting(true);
      try {
        await authService.registerParent({
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        });
        setMessage("Đăng ký thành công. Bạn có thể đăng nhập bằng email hoặc tên tài khoản.");
        form.current?.reset();
        setVisiblePasswords({});
      } catch (error) {
        setMessageType("error");
        setMessage(error.message);
      } finally {
        setSubmitting(false);
      }
    } else if (isRealApi && forgot) {
      setSubmitting(true);
      try {
        await authService.forgotPassword(values.email.trim());
        setMessage("Nếu email tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.");
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
            ...(mode === "register" ? [["username", "Tên tài khoản", "text"]] : []),
            ...(mode === "login"
              ? [["identifier", "Email hoặc tên tài khoản", "text"]]
              : [["email", "Email", "email"]]),
            ...(!forgot ? [["password", "Mật khẩu", "password"]] : []),
            ...(mode === "register"
              ? [["confirm", "Nhập lại mật khẩu", "password"]]
              : []),
          ].map(([name, label, type]) => (
            <div className="field" key={name}>
              <label htmlFor={`auth-${name === "identifier" ? "email" : name}`}>{label}</label>
              <div className="auth-input-wrap">
                {name === "username" ? (
                  <UserCircle size={20} aria-hidden="true" />
                ) : name === "email" || name === "identifier" ? (
                  <EnvelopeSimple size={20} aria-hidden="true" />
                ) : (
                  <LockKey size={20} aria-hidden="true" />
                )}
                <input
                  id={`auth-${name === "identifier" ? "email" : name}`}
                  name={name}
                  type={visiblePasswords[name] ? "text" : type}
                  placeholder={
                    name === "email"
                      ? "bome@example.com"
                      : name === "identifier"
                        ? "Email hoặc tên tài khoản"
                        : mode === "register" && isRealApi
                          ? "Ít nhất 6 ký tự"
                          : mode === "register"
                            ? "Ít nhất 8 ký tự"
                            : "Nhập mật khẩu"
                  }
                  autoComplete={
                    name === "email"
                      ? "email"
                      : name === "identifier" || name === "username"
                        ? "username"
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
            <div className="auth-login-options">
              <Link className="text-link forgot-link" to="/auth/forgot-password">
                Quên mật khẩu?
              </Link>
            </div>
          )}
          <button className="button auth-submit" type="submit" disabled={submitting}>
            {copy.button}
            <ArrowRight size={20} aria-hidden="true" />
          </button>
          <div role="status">
            {message && <p className={`${messageType === "error" ? "auth-error-message" : "success-message"}`}>{message}</p>}
          </div>
        </form>
        <p className="auth-alternate">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <Link to="/auth/register">Đăng ký</Link>
            </>
          ) : (
            <Link to="/auth/login">Quay lại đăng nhập</Link>
          )}
        </p>
      </section>
    </div>
  );
}
