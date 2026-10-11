import {
  ArrowRight,
  BookOpen,
  ChartLineUp,
  CheckCircle,
  LockKey,
  EnvelopeSimple,
  House,
  Package,
  ShieldCheck,
  UserCircle,
  UsersThree,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
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
  const { user } = useAuth();
  const details = workspaceDetails[user.role];
  const home = roleHome(user.role);
  const roleLabel = roleLabels[user.role] || "Tài khoản SketchTale";
  const displayName = user.name?.trim() || "Tài khoản SketchTale";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(-2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("vi");

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
    </div>
  );
}
