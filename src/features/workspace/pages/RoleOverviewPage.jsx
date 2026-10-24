import { ArrowRight, BookOpen, ChartLineUp, Gear, LockKey, Package, Prohibit, ShieldCheck, UsersThree } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { isRealApi } from "../../auth/authService";
import { roleLabels, ROLES } from "../../../lib/permissions/roles";

const copy = {
  [ROLES.CONTENT]: { eyebrow: "CONTENT MANAGER", title: "Tạo nên những câu chuyện để bé gặp gỡ.", description: "Khu vực quản lý story template, asset và phiên bản publish.", items: [{ icon: BookOpen, title: "Story templates", text: "Danh sách truyện và bản nháp", to: "/content/stories" }, { icon: Package, title: "Asset library", text: "Tài sản minh họa dùng chung", to: "/content/assets" }, { icon: ChartLineUp, title: "Content statistics", text: "Theo dõi hiệu quả nội dung", to: "/content/statistics" }] },
  [ROLES.ADMIN]: { eyebrow: "ADMIN CONTROL ROOM", title: "Giữ cho SketchTale vận hành rõ ràng.", description: "Khu vực quản lý tài khoản phụ huynh, báo cáo, từ khóa hạn chế và các danh mục vận hành.", items: [{ icon: UsersThree, title: "Tài khoản", text: "Tìm kiếm và quản lý tài khoản phụ huynh", to: "/admin/users" }, { icon: ShieldCheck, title: "Báo cáo nội dung", text: "Hàng đợi kiểm duyệt khiếu nại", to: "/admin/reports" }, { icon: Prohibit, title: "Từ khóa hạn chế", text: "Quy tắc an toàn và kiểm duyệt từ khóa", to: "/admin/restrictions" }, { icon: Package, title: "Gói sử dụng", text: "Quản lý gói tài khoản và quota credit", to: "/admin/subscription-plans" }, { icon: ShieldCheck, title: "Nhật ký thao tác", text: "Nhật ký thao tác và kiểm toán hệ thống", to: "/admin/audit" }] },
};

export default function RoleOverviewPage({ role }) {
  const { user } = useAuth();
  const page = copy[role];
  return <div className="workspace-dashboard"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p>{page.description}</p></div><span className="workspace-dashboard-chip"><LockKey size={15} aria-hidden="true" /> {isRealApi ? "Backend session" : "Mock session"}</span></div><section className="workspace-dashboard-intro"><div><span className="workspace-dashboard-kicker">XIN CHÀO, {user.name.toUpperCase()}</span><h2>Một workspace, ba vai trò, cùng một tiêu chuẩn rõ ràng.</h2><p>Route guard đã xác nhận quyền <strong>{roleLabels[user.role]}</strong>. Các module nghiệp vụ sẽ được triển khai tiếp theo backlog trong hai implementation plan.</p></div><div className="workspace-dashboard-mark"><BookOpen size={62} weight="duotone" aria-hidden="true" /></div></section><div className="workspace-dashboard-grid">{page.items.map(({ icon: Icon, title, text, to }) => <Link className="workspace-module-card" to={to} key={to}><span><Icon size={24} aria-hidden="true" /></span><strong>{title}</strong><p>{text}</p><ArrowRight size={18} aria-hidden="true" /></Link>)}</div></div>;
}
