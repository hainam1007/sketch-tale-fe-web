import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, EnvelopeSimple, ShieldCheck, Sparkle, Star, WarningCircle } from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router-dom";
import BrandLogo from "../../../components/branding/BrandLogo";
import { authService } from "../authService";
import "./auth.css";

const headings = {
  pending: "Cần xác nhận email",
  ready: "Xác nhận email của bạn",
  loading: "Đang xác thực email",
  success: "Email đã được xác thực",
  error: "Chưa thể xác thực email",
  invalid: "Liên kết không hợp lệ",
  resending: "Đang gửi lại email",
  resent: "Đã gửi email xác nhận",
};

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const email = (searchParams.get("email") || "").trim();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState(email && token ? "ready" : email ? "pending" : "invalid");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email && !token) return;
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [email, token]);

  async function confirmEmail() {
    setStatus("loading");
    setMessage("");
    try {
      await authService.confirmEmail({ email, token });
      setStatus("success");
    } catch (error) {
      setMessage(error.message);
      setStatus("error");
    }
  }

  async function resendEmail() {
    setStatus("resending");
    setMessage("");
    try {
      await authService.resendConfirmationEmail(email);
      setStatus("resent");
    } catch (error) {
      setMessage(error.message);
      setStatus("error");
    }
  }

  return (
    <div className="container auth-story-page">
      <section className="auth-story" aria-label="SketchTale">
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
          <Star className="auth-star auth-star-one" size={34} weight="fill" aria-hidden="true" />
          <Sparkle className="auth-star auth-star-two" size={30} weight="fill" aria-hidden="true" />
          <Star className="auth-star auth-star-three" size={18} weight="fill" aria-hidden="true" />
          <img src="/images/hero.webp" alt="Những người bạn SketchTale cùng khám phá cuốn sách" width="800" height="600" />
          <span className="auth-story-note">
            <Sparkle size={17} weight="fill" aria-hidden="true" /> Tài khoản an toàn, sẵn sàng bắt đầu
          </span>
        </div>
        <p className="auth-story-caption">
          Xác nhận email để hoàn tất đăng ký.
          <br />
          Hành trình đọc truyện cùng bé sắp bắt đầu.
        </p>
      </section>

      <section className="auth-card" aria-labelledby="confirm-email-title">
        <div className="auth-card-topline">
          <div className="auth-card-mark">
            <BrandLogo variant="widget" alt="Biểu tượng SketchTale" />
          </div>
          <span className="auth-kicker">XÁC THỰC TÀI KHOẢN</span>
        </div>
        <header className="auth-intro">
          <h1 id="confirm-email-title">{headings[status]}</h1>
          <p>
            {status === "pending"
              ? "Email xác nhận đã được gửi đến địa chỉ này. Hãy kiểm tra hộp thư đến và thư rác, rồi mở liên kết để hoàn tất đăng ký."
              : status === "success"
              ? "Email của bạn đã được xác nhận. Đăng nhập để tiếp tục."
              : status === "invalid"
                ? "Đường dẫn thiếu email hoặc mã xác nhận. Hãy mở lại liên kết trong email."
                : status === "error"
                  ? "Liên kết có thể đã hết hạn hoặc được sử dụng. Bạn có thể yêu cầu gửi email mới."
                  : status === "resent"
                    ? "Nếu địa chỉ email tồn tại, hướng dẫn xác nhận mới sẽ được gửi đến hộp thư của bạn."
                    : "Xác nhận địa chỉ email để hoàn tất việc tạo tài khoản SketchTale."}
          </p>
        </header>

        {email && <p className="auth-verify-email"><EnvelopeSimple size={18} aria-hidden="true" /> {email}</p>}

        <div role={status === "error" || status === "invalid" ? "alert" : "status"} aria-live="polite">
          {message && <p className="auth-error-message">{message}</p>}
        </div>

        {status === "ready" && (
          <button className="button auth-submit" type="button" onClick={confirmEmail}>
            Xác nhận email <ShieldCheck size={20} aria-hidden="true" />
          </button>
        )}
        {status === "loading" && (
          <p className="success-message">Đang kiểm tra liên kết xác nhận…</p>
        )}
        {status === "success" && (
          <Link className="button auth-submit auth-verify-link" to="/auth/login">
            Đăng nhập <ArrowRight size={20} aria-hidden="true" />
          </Link>
        )}
        {(status === "pending" || status === "error" || status === "resent") && email && (
          <button className="button auth-submit" type="button" onClick={resendEmail}>
            Gửi email xác nhận mới <ArrowRight size={20} aria-hidden="true" />
          </button>
        )}
        {status === "resending" && <p className="success-message">Đang gửi email xác nhận mới…</p>}
        {status === "resent" && <p className="success-message"><CheckCircle size={18} aria-hidden="true" /> Đã tiếp nhận yêu cầu gửi lại.</p>}
        {status === "invalid" && (
          <Link className="button auth-submit auth-verify-link" to="/auth/register">
            Tạo tài khoản <ArrowRight size={20} aria-hidden="true" />
          </Link>
        )}
        {(status === "error" || status === "resent") && (
          <p className="auth-alternate"><Link to="/auth/login">Quay lại đăng nhập</Link></p>
        )}
        {status === "invalid" && <WarningCircle className="auth-verify-warning" size={20} aria-hidden="true" />}
      </section>
    </div>
  );
}
