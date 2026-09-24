import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChartLineUp,
  DownloadSimple,
  House,
  List,
  Package,
  SignOut,
  ShieldCheck,
  UserCircle,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../../features/auth/AuthProvider";
import BrandLogo from "../../components/branding/BrandLogo";
import { ROLES, roleHome, roleLabels } from "../../lib/permissions/roles";
import { confirmContentEditorNavigation } from "../../features/content/hooks/useEditorSaveState";
import "./workspace.css";
import "../../features/parent/parent.css";

const roleNavigation = {
  [ROLES.PARENT]: [
    { to: "/parent", label: "Tổng quan", icon: House, end: true },
    { to: "/parent/children", label: "Hồ sơ bé", icon: UsersThree },
    { to: "/parent/plan", label: "Gói sử dụng", icon: Package },
    { to: "/parent/exports", label: "Xuất truyện", icon: DownloadSimple },
  ],
  [ROLES.CONTENT]: [
    { to: "/content", label: "Tổng quan", icon: House, end: true },
    { to: "/content/stories", label: "Truyện", icon: BookOpen },
    { to: "/content/assets", label: "Kho tài sản", icon: Package },
    { to: "/content/statistics", label: "Hiệu quả", icon: ChartLineUp },
  ],
  [ROLES.ADMIN]: [
    { to: "/admin", label: "Tổng quan", icon: House, end: true },
    { to: "/admin/users", label: "Tài khoản", icon: UsersThree },
    { to: "/admin/reports", label: "Báo cáo nội dung", icon: ShieldCheck },
    { to: "/admin/monitoring", label: "Giám sát", icon: ChartLineUp },
    { to: "/admin/statistics", label: "Số liệu", icon: ChartLineUp },
    { to: "/admin/audit", label: "Audit", icon: ShieldCheck },
  ],
};

export default function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = roleNavigation[user.role] || roleNavigation[ROLES.PARENT];

  async function handleLogout() {
    if (!confirmContentEditorNavigation({ defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false })) return;
    navigate("/", { replace: true });
    await logout();
  }

  return (
    <div className="workspace-app">
      <aside className={`workspace-sidebar ${mobileOpen ? "workspace-sidebar-open" : ""}`}>
        <div className="workspace-sidebar-top">
          <Link to={roleHome(user.role)} className="workspace-brand" onClick={() => setMobileOpen(false)}>
            <BrandLogo alt="SketchTale - Trang chủ khu vực làm việc" />
          </Link>
          <button className="workspace-close" type="button" aria-label="Đóng điều hướng" onClick={() => setMobileOpen(false)}>
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="workspace-role-label">{roleLabels[user.role]}</div>
        <nav className="workspace-nav" aria-label="Điều hướng khu vực làm việc">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={(event) => { if (!confirmContentEditorNavigation(event)) event.preventDefault(); else setMobileOpen(false); }}>
              <Icon size={20} aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="workspace-sidebar-bottom">
          <NavLink to="/profile" onClick={(event) => { if (!confirmContentEditorNavigation(event)) event.preventDefault(); else setMobileOpen(false); }}>
            <UserCircle size={20} aria-hidden="true" /> Hồ sơ tài khoản
          </NavLink>
          <button className="workspace-logout" type="button" onClick={handleLogout}>
            <SignOut size={20} aria-hidden="true" /> Đăng xuất
          </button>
        </div>
      </aside>
      {mobileOpen && <button className="workspace-scrim" type="button" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} />}
      <div className="workspace-content">
        <button className="workspace-menu workspace-mobile-menu" type="button" aria-label="Mở điều hướng" onClick={() => setMobileOpen(true)}>
          <List size={23} aria-hidden="true" />
        </button>
        <main id="main" className="workspace-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
