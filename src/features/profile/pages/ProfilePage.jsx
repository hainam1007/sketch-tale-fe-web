import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChartLineUp,
  CheckCircle,
  Eye,
  EyeSlash,
  LockKey,
  EnvelopeSimple,
  House,
  Package,
  ShieldCheck,
  UserCircle,
  UsersThree,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { authService, isRealApi } from "../../auth/authService";
import { roleHome, roleLabels, ROLES } from "../../../lib/permissions/roles";
import "../profile.css";

const workspaceDetails = {
  [ROLES.CHILD]: {
    eyebrow: "Không gian của bé",
    title: "Những câu chuyện đang chờ bé khám phá.",
    description: "Tiếp tục đọc truyện và sáng tạo trong ứng dụng SketchTale trên điện thoại.",
    shortcuts: [{ icon: House, title: "Trang chủ SketchTale", description: "Tìm hiểu thế giới truyện dành cho bé.", to: "/" }],
  },
  [ROLES.PARENT]: {
    eyebrow: "Không gian gia đình",
    title: "Chăm những câu chuyện lớn lên cùng bé.",
    description: "Theo dõi hồ sơ bé, gói sử dụng và những nội dung đang chờ bạn xem.",
    shortcuts: [
      { icon: UsersThree, title: "Hồ sơ bé", description: "Quản lý không gian riêng của từng bé.", to: "/parent/children" },
      { icon: BookOpen, title: "Thư viện truyện", description: "Khám phá và chọn truyện cho bé.", to: "/parent/library" },
      { icon: Package, title: "Gói sử dụng", description: "Xem hạn mức và quyền lợi hiện tại.", to: "/parent/plan" },
    ],
  },
  [ROLES.CONTENT]: {
    eyebrow: "Không gian nội dung",
    title: "Đưa mỗi bản nháp đến gần một trang sách.",
    description: "Quản lý truyện, tài sản sáng tạo và hiệu quả nội dung tại một nơi.",
    shortcuts: [
      { icon: BookOpen, title: "Kho truyện", description: "Quản lý bản nháp và phiên bản truyện.", to: "/content/stories" },
      { icon: Package, title: "Kho tài sản", description: "Tìm và quản lý tài sản dùng chung.", to: "/content/assets" },
      { icon: ChartLineUp, title: "Hiệu quả", description: "Theo dõi dữ liệu đọc và hoàn thành.", to: "/content/statistics" },
    ],
  },
  [ROLES.ADMIN]: {
    eyebrow: "Không gian quản trị",
    title: "Giữ cho workspace vận hành rõ ràng.",
    description: "Kiểm tra tài khoản, báo cáo và các tín hiệu cần xử lý.",
    shortcuts: [
      { icon: UsersThree, title: "Tài khoản", description: "Quản lý người dùng và quyền truy cập.", to: "/admin/users" },
      { icon: ShieldCheck, title: "Báo cáo nội dung", description: "Xem các báo cáo đang chờ xử lý.", to: "/admin/reports" },
      { icon: ChartLineUp, title: "Giám sát", description: "Theo dõi sức khỏe vận hành.", to: "/admin/monitoring" },
    ],
  },
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] = useState("status");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const details = workspaceDetails[user.role];
  const home = roleHome(user.role);
  const roleLabel = roleLabels[user.role] || "Tài khoản SketchTale";
  const displayName = user.name?.trim() || "Tài khoản SketchTale";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(-2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("vi");

  async function changePassword(event) {
    event.preventDefault();
    setPasswordMessage("");
    if (!passwords.current || !passwords.next) {
      setPasswordMessageType("alert");
      setPasswordMessage("Nhập mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordMessageType("alert");
      setPasswordMessage("Hai mật khẩu mới chưa trùng nhau.");
      document.getElementById("profile-confirm-password")?.focus();
      return;
    }
    setIsChangingPassword(true);
    try {
      await authService.changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: "", next: "", confirm: "" });
      await logout();
      navigate("/auth/login?passwordChanged=1", { replace: true });
    } catch (error) {
      setPasswordMessageType("alert");
      setPasswordMessage(error.message || "Chưa thể cập nhật mật khẩu. Hãy thử lại.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  function passwordField(name, label, autoComplete) {
    const fieldId = `profile-${name}-password`;
    const isVisible = Boolean(visiblePasswords[name]);
    return <div className="profile-password-field" key={name}>
      <label htmlFor={fieldId}>{label}</label>
      <div className="profile-password-input">
        <input id={fieldId} type={isVisible ? "text" : "password"} autoComplete={autoComplete} value={passwords[name]} onChange={(event) => setPasswords((current) => ({ ...current, [name]: event.target.value }))} disabled={isChangingPassword} />
        <button type="button" className="profile-password-toggle" aria-label={isVisible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`} aria-pressed={isVisible} onClick={() => setVisiblePasswords((current) => ({ ...current, [name]: !current[name] }))}>
          {isVisible ? <EyeSlash size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
        </button>
      </div>
    </div>;
  }

  return (
    <div className="workspace-profile-page">
      <header className="profile-page-heading">
        <p className="profile-eyebrow">Tài khoản SketchTale</p>
        <h1>Hồ sơ của bạn</h1>
        <p>Thông tin cá nhân và không gian dành riêng cho bạn.</p>
      </header>

      <section className="profile-hero" aria-labelledby="profile-identity-title">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">{initials}</div>
          <div className="profile-identity-text">
            <span className="profile-role">{roleLabel}</span>
            <h2 id="profile-identity-title">{displayName}</h2>
            <p>{user.email || "Chưa có email"}</p>
          </div>
        </div>
        <Link className="profile-home-link" to={home}>
          {user.role === ROLES.CHILD ? "Về trang chủ" : "Về không gian của bạn"}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <div className="profile-content-grid">
        <section className="profile-panel" aria-labelledby="profile-details-title">
          <div className="profile-panel-heading">
            <span className="profile-panel-icon"><UserCircle size={24} aria-hidden="true" /></span>
            <div><h2 id="profile-details-title">Thông tin tài khoản</h2><p>Thông tin bạn dùng để đăng nhập SketchTale.</p></div>
          </div>
          <dl className="profile-details-list">
            <div><dt>Họ và tên</dt><dd>{displayName}</dd></div>
            <div><dt><EnvelopeSimple size={17} aria-hidden="true" /> Email đăng nhập</dt><dd>{user.email || "Chưa có email"}</dd></div>
            <div><dt>Vai trò</dt><dd><span className="profile-role-value">{roleLabel}</span></dd></div>
          </dl>
          <div className="profile-session" aria-labelledby="profile-session-title">
            <ShieldCheck size={23} aria-hidden="true" />
            <div><h3 id="profile-session-title">Phiên đăng nhập</h3><p><CheckCircle size={16} weight="fill" aria-hidden="true" /> Bạn đang đăng nhập</p></div>
          </div>
          <p className="profile-session-footnote"><LockKey size={16} aria-hidden="true" /> Quyền truy cập được giới hạn theo vai trò của bạn.</p>
        </section>

        {details && <section className="profile-workspace-panel" aria-labelledby="profile-shortcuts-title">
          <div className="profile-section-heading">
            <p className="profile-eyebrow">{details.eyebrow}</p>
            <h2 id="profile-shortcuts-title">{user.role === ROLES.PARENT ? "Đồng hành cùng bé" : user.role === ROLES.CHILD ? "Khám phá SketchTale" : "Tiếp tục công việc"}</h2>
            <p>{details.description}</p>
          </div>
          <nav className="profile-shortcuts" aria-label="Truy cập nhanh theo vai trò">
            {details.shortcuts.map(({ icon: Icon, title, description, to }) => (
              <Link className="profile-shortcut" to={to} key={to}>
                <span className="profile-shortcut-icon"><Icon size={22} aria-hidden="true" /></span>
                <span><strong>{title}</strong><small>{description}</small></span>
                <ArrowRight className="profile-shortcut-arrow" size={18} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </section>}
      </div>

      <section className="profile-password-panel" aria-labelledby="profile-password-title">
        <div className="profile-panel-heading">
          <span className="profile-panel-icon"><LockKey size={24} aria-hidden="true" /></span>
          <div><h2 id="profile-password-title">Đổi mật khẩu</h2><p>Mật khẩu hiện tại sẽ được xác minh trước khi cập nhật.</p></div>
        </div>
        {isRealApi ? <form className="profile-password-form" onSubmit={changePassword}>
          {passwordField("current", "Mật khẩu hiện tại", "current-password")}
          {passwordField("next", "Mật khẩu mới", "new-password")}
          {passwordField("confirm", "Nhập lại mật khẩu mới", "new-password")}
          <div className="profile-password-feedback" role={passwordMessageType} aria-live="polite">{passwordMessage && <p>{passwordMessage}</p>}</div>
          <button className="workspace-button" type="submit" disabled={isChangingPassword}>{isChangingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</button>
          <small>Yêu cầu về độ mạnh của mật khẩu sẽ được hệ thống kiểm tra.</small>
        </form> : <p className="profile-password-unavailable" role="status">Đổi mật khẩu sẽ khả dụng khi kết nối API thật. Bản demo không lưu thông tin mật khẩu.</p>}
      </section>
    </div>
  );
}
