import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChartLineUp,
  CheckCircle,
  LockKey,
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
  [ROLES.PARENT]: {
    eyebrow: "GÓC CỦA GIA ĐÌNH",
    title: "Chăm những câu chuyện lớn lên cùng bé.",
    description: "Theo dõi hồ sơ bé, gói sử dụng và những nội dung đang chờ bạn xem.",
    shortcuts: [
      { icon: UsersThree, title: "Hồ sơ bé", description: "Quản lý không gian riêng của từng bé.", to: "/parent/children" },
      { icon: Package, title: "Gói sử dụng", description: "Xem hạn mức và quyền lợi hiện tại.", to: "/parent/plan" },
    ],
  },
  [ROLES.CONTENT]: {
    eyebrow: "CONTENT MANAGER",
    title: "Đưa mỗi bản nháp đến gần một trang sách.",
    description: "Tiếp tục xây dựng story, chọn asset và theo dõi hiệu quả nội dung.",
    shortcuts: [
      { icon: BookOpen, title: "Kho truyện", description: "Mở các bản nháp và phiên bản story.", to: "/content/stories" },
      { icon: Package, title: "Kho tài sản", description: "Tìm và quản lý asset dùng chung.", to: "/content/assets" },
      { icon: ChartLineUp, title: "Hiệu quả", description: "Theo dõi dữ liệu đọc và hoàn thành.", to: "/content/statistics" },
    ],
  },
  [ROLES.ADMIN]: {
    eyebrow: "CONTROL ROOM",
    title: "Giữ cho workspace vận hành rõ ràng.",
    description: "Kiểm tra tài khoản, báo cáo và các tín hiệu cần xử lý.",
    shortcuts: [
      { icon: UsersThree, title: "Tài khoản", description: "Quản lý người dùng và quyền truy cập.", to: "/admin/users" },
      { icon: ShieldCheck, title: "Báo cáo nội dung", description: "Xem các report đang chờ xử lý.", to: "/admin/reports" },
      { icon: ChartLineUp, title: "Giám sát", description: "Theo dõi sức khỏe vận hành.", to: "/admin/monitoring" },
    ],
  },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const details = workspaceDetails[user.role] || workspaceDetails[ROLES.PARENT];
  const home = roleHome(user.role);
  const roleLabel = roleLabels[user.role] || "Tài khoản SketchTale";

  return (
    <div className="workspace-profile-page">
      <div className="workspace-page-heading profile-page-heading">
        <div>
          <p className="workspace-eyebrow">TÀI KHOẢN</p>
          <h1>Hồ sơ của bạn</h1>
          <p>Thông tin tài khoản và những lối tắt phù hợp với workspace đang dùng.</p>
        </div>
        <Link className="profile-back-link" to={home}><ArrowLeft size={17} aria-hidden="true" /> Quay về workspace</Link>
      </div>

      <section className="profile-hero" aria-labelledby="profile-identity-title">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true"><UserCircle size={63} weight="duotone" /></div>
          <div>
            <div className="profile-role-line"><span className="profile-role">{roleLabel}</span><span className="profile-status"><CheckCircle size={15} weight="fill" aria-hidden="true" /> Đang hoạt động</span></div>
            <h2 id="profile-identity-title">{user.name}</h2>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="profile-hero-note"><span>{details.eyebrow}</span><strong>{details.title}</strong><p>{details.description}</p></div>
      </section>

      <div className="profile-content-grid">
        <section className="profile-panel" aria-labelledby="profile-details-title">
          <div className="profile-panel-heading"><div className="profile-panel-icon"><UserCircle size={20} aria-hidden="true" /></div><div><p className="workspace-eyebrow">ACCOUNT DETAILS</p><h2 id="profile-details-title">Thông tin tài khoản</h2></div></div>
          <dl className="profile-details-list">
            <div><dt>Họ và tên</dt><dd>{user.name}</dd></div>
            <div><dt>Email đăng nhập</dt><dd>{user.email}</dd></div>
            <div><dt>Vai trò</dt><dd>{roleLabel}</dd></div>
          </dl>
        </section>

        <section className="profile-panel profile-session-panel" aria-labelledby="profile-session-title">
          <div className="profile-panel-heading"><div className="profile-panel-icon profile-panel-icon-green"><ShieldCheck size={20} aria-hidden="true" /></div><div><p className="workspace-eyebrow">SESSION STATUS</p><h2 id="profile-session-title">Phiên đăng nhập</h2></div></div>
          <div className="profile-session-status"><CheckCircle size={19} weight="fill" aria-hidden="true" /><div><strong>Phiên đang hoạt động</strong><p>Tài khoản đã được xác thực trong phiên demo hiện tại.</p></div></div>
          <div className="profile-session-footnote"><LockKey size={16} aria-hidden="true" /> Dữ liệu workspace được giới hạn theo vai trò của bạn.</div>
        </section>
      </div>

      <section className="profile-workspace-panel" aria-labelledby="profile-shortcuts-title">
        <div className="profile-section-heading"><div><p className="workspace-eyebrow">WORKSPACE SHORTCUTS</p><h2 id="profile-shortcuts-title">Tiếp tục công việc</h2><p>Mở nhanh khu vực bạn thường dùng trong {roleLabel}.</p></div></div>
        <div className={`profile-shortcuts profile-shortcuts-${details.shortcuts.length}`}>
          {details.shortcuts.map(({ icon: Icon, title, description, to }) => <Link className="profile-shortcut" to={to} key={to}><span className="profile-shortcut-icon"><Icon size={20} aria-hidden="true" /></span><span><strong>{title}</strong><small>{description}</small></span><ArrowRight className="profile-shortcut-arrow" size={17} aria-hidden="true" /></Link>)}
        </div>
      </section>
    </div>
  );
}
