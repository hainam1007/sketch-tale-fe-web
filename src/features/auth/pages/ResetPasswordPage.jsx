import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, EnvelopeSimple, Eye, EyeSlash, LockKey, Sparkle, Star } from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router-dom";
import BrandLogo from "../../../components/branding/BrandLogo";
import { authService, isRealApi } from "../authService";
import "./auth.css";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email] = useState(() => (searchParams.get("email") || "").trim());
  const [token, setToken] = useState(() => searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState({ password: false, confirm: false });
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!searchParams.has("token") && !searchParams.has("email")) return;
    // Keep the reset token only in component memory after the link has been read.
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [searchParams]);

  const tokenAvailable = Boolean(email && token);
  const isSubmitting = status === "submitting";

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (!tokenAvailable) {
      setStatus("invalid");
      return;
    }
    if (!password) {
      setMessage("Nhập mật khẩu mới.");
      document.getElementById("reset-password")?.focus();
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Hai mật khẩu chưa trùng nhau.");
      document.getElementById("reset-confirm-password")?.focus();
      return;
    }
    if (!isRealApi) {
      setStatus("unavailable");
      setMessage("Đặt lại mật khẩu chưa khả dụng trong bản demo.");
      return;
    }

    setStatus("submitting");
    try {
      await authService.resetPassword({ email, token, newPassword: password });
      setPassword("");
      setConfirmPassword("");
      setToken("");
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Chưa thể đặt lại mật khẩu. Hãy yêu cầu liên kết mới.");
    }
  }

  return (
    <div className="container auth-story-page">
      <section className="auth-story" aria-label="Cùng bé mở trang sách">
        <Link to="/auth/login" className="auth-back"><ArrowLeft size={17} aria-hidden="true" /> Quay lại đăng nhập</Link>
        <div className="auth-story-heading">
          <span className="auth-kicker"><BookOpen size={18} aria-hidden="true" /> MỖI NGÀY, MỘT CÂU CHUYỆN</span>
          <h2>Mở trang sách nhỏ.<br /><span>Chạm thế giới lớn.</span></h2>
        </div>
        <div className="auth-illustration">
          <span className="auth-orbit" aria-hidden="true" />
          <Star className="auth-star auth-star-one" size={34} weight="fill" aria-hidden="true" />
          <Sparkle className="auth-star auth-star-two" size={30} weight="fill" aria-hidden="true" />
          <Star className="auth-star auth-star-three" size={18} weight="fill" aria-hidden="true" />
          <img src="/images/hero.webp" alt="Những người bạn SketchTale cùng khám phá cuốn sách" width="800" height="600" />
          <span className="auth-story-note"><Sparkle size={17} weight="fill" aria-hidden="true" /> Tài khoản an toàn, sẵn sàng bắt đầu</span>
        </div>
        <p className="auth-story-caption">Mật khẩu mới giúp bảo vệ những câu chuyện của gia đình.<br />Bạn sẽ đăng nhập lại sau khi cập nhật.</p>
      </section>

      <section className="auth-card" aria-labelledby="reset-password-title">
        <div className="auth-card-topline">
          <div className="auth-card-mark"><BrandLogo variant="widget" alt="Biểu tượng SketchTale" /></div>
          <span className="auth-kicker">BẢO MẬT TÀI KHOẢN</span>
        </div>
        <header className="auth-intro">
          <h1 id="reset-password-title">{status === "success" ? "Mật khẩu đã được cập nhật" : "Đặt lại mật khẩu"}</h1>
          <p>{status === "success" ? "Hãy đăng nhập bằng mật khẩu mới để tiếp tục." : "Tạo mật khẩu mới cho tài khoản SketchTale của bạn."}</p>
        </header>

        {status === "success" ? (
          <div className="auth-reset-success" role="status">
            <p>Mật khẩu đã được thay đổi. Liên kết đặt lại đã hết hiệu lực.</p>
            <Link className="button auth-submit auth-verify-link" to="/auth/login">Đăng nhập <ArrowRight size={20} aria-hidden="true" /></Link>
          </div>
        ) : !tokenAvailable ? (
          <div className="auth-reset-unavailable" role="alert">
            <p>Liên kết đặt lại thiếu thông tin hoặc đã bị xóa khỏi địa chỉ trang. Hãy yêu cầu gửi liên kết mới.</p>
            <Link className="button auth-submit auth-verify-link" to="/auth/forgot-password">Gửi liên kết mới <ArrowRight size={20} aria-hidden="true" /></Link>
          </div>
        ) : !isRealApi ? (
          <div className="auth-reset-unavailable" role="status">
            <p>Chức năng này chỉ hoạt động khi kết nối API thật. Bản demo không lưu mật khẩu.</p>
            <Link className="button auth-submit auth-verify-link" to="/auth/login">Quay lại đăng nhập <ArrowRight size={20} aria-hidden="true" /></Link>
          </div>
        ) : (
          <form className="auth-reset-form" noValidate onSubmit={submit}>
            <p className="auth-verify-email"><EnvelopeSimple size={18} aria-hidden="true" /> {email}</p>
            <div className="field">
              <label htmlFor="reset-password">Mật khẩu mới</label>
              <div className="auth-input-wrap">
                <LockKey size={20} aria-hidden="true" />
                <input id="reset-password" type={visible.password ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="reset-password-hint" disabled={isSubmitting} />
                <button className="auth-password-toggle" type="button" aria-label={visible.password ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"} aria-pressed={visible.password} onClick={() => setVisible((current) => ({ ...current, password: !current.password }))}>
                  {visible.password ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
              <small id="reset-password-hint" className="auth-reset-hint">Yêu cầu về độ mạnh sẽ được hệ thống kiểm tra khi lưu.</small>
            </div>
            <div className="field">
              <label htmlFor="reset-confirm-password">Nhập lại mật khẩu mới</label>
              <div className="auth-input-wrap">
                <LockKey size={20} aria-hidden="true" />
                <input id="reset-confirm-password" type={visible.confirm ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={isSubmitting} />
                <button className="auth-password-toggle" type="button" aria-label={visible.confirm ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"} aria-pressed={visible.confirm} onClick={() => setVisible((current) => ({ ...current, confirm: !current.confirm }))}>
                  {visible.confirm ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div role={status === "error" ? "alert" : "status"} aria-live="polite">{message && <p className={status === "error" ? "auth-error-message" : "success-message"}>{message}</p>}</div>
            <button className="button auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}<ArrowRight size={20} aria-hidden="true" /></button>
          </form>
        )}

        {status !== "success" && <p className="auth-alternate"><Link to="/auth/login">Quay lại đăng nhập</Link></p>}
      </section>
    </div>
  );
}
