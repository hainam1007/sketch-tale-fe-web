import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChartLineUp,
  Gauge,
  House,
  List,
  Package,
  Prohibit,
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
import "../../features/content/content.css";
import "../../features/parent/parent.css";

const roleNavigation = {
  [ROLES.PARENT]: [
    { to: "/parent", label: "Tổng quan", icon: House, end: true },
    { to: "/parent/children", label: "Hồ sơ bé", icon: UsersThree },
    { to: "/parent/plan", label: "Gói sử dụng", icon: Package },
    { to: "/parent/library", label: "Thư viện truyện", icon: BookOpen },
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
    { to: "/admin/permissions", label: "Phân quyền", icon: ShieldCheck },
    { to: "/admin/reports", label: "Báo cáo nội dung", icon: ShieldCheck },
    { to: "/admin/system-limits", label: "Giới hạn hệ thống", icon: Gauge },
    { to: "/admin/restrictions", label: "Nội dung hạn chế", icon: Prohibit },
    { to: "/admin/monitoring", label: "Giám sát", icon: ChartLineUp },
    { to: "/admin/statistics", label: "Số liệu", icon: ChartLineUp },
    { to: "/admin/audit", label: "Audit", icon: ShieldCheck },
  ],
};

export default function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStoryStudio = user.role === ROLES.CONTENT && /\/content\/stories\/[^/]+\/pages\/?$/.test(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigation = roleNavigation[user.role] || roleNavigation[ROLES.PARENT];

  function closeMobile() {
    setMobileOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  }

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const sidebar = sidebarRef.current;
    const focusable = () => [...sidebar.querySelectorAll("a, button, select, input, textarea, [tabindex]:not([tabindex='-1'])")].filter((node) => !node.disabled);
    sidebar.querySelector(".workspace-close")?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobile();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  async function handleLogout() {
    if (!confirmContentEditorNavigation({ defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false })) return;
    navigate("/", { replace: true });
    await logout();
  }

  return (
    <div className={`workspace-app ${user.role === ROLES.PARENT ? "workspace-app-parent" : ""} ${user.role === ROLES.CONTENT ? "workspace-app-content" : ""}${isStoryStudio ? " workspace-app-studio" : ""}`}>
      <aside ref={sidebarRef} className={`workspace-sidebar ${mobileOpen ? "workspace-sidebar-open" : ""}`}>
        <div className="workspace-sidebar-top">
          <Link to={roleHome(user.role)} className="workspace-brand" onClick={closeMobile}>
            <BrandLogo alt="SketchTale - Trang chủ khu vực làm việc" />
          </Link>
          {mobileOpen && <button className="workspace-close" type="button" aria-label="Đóng điều hướng" onClick={closeMobile}>
            <X size={22} aria-hidden="true" />
          </button>}
        </div>
        <div className="workspace-role-label">{roleLabels[user.role]}</div>
        <nav id="workspace-navigation" className="workspace-nav" aria-label="Điều hướng khu vực làm việc">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={(event) => { if (!confirmContentEditorNavigation(event)) event.preventDefault(); else closeMobile(); }}>
              <Icon size={20} aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="workspace-sidebar-bottom">
          <NavLink to="/profile" onClick={(event) => { if (!confirmContentEditorNavigation(event)) event.preventDefault(); else closeMobile(); }}>
            <UserCircle size={20} aria-hidden="true" /> Hồ sơ tài khoản
          </NavLink>
          <button className="workspace-logout" type="button" onClick={handleLogout}>
            <SignOut size={20} aria-hidden="true" /> Đăng xuất
          </button>
        </div>
      </aside>
      {mobileOpen && <button className="workspace-scrim" type="button" aria-label="Đóng menu" onClick={closeMobile} />}
      <div className="workspace-content">
        <button ref={menuButtonRef} className="workspace-menu workspace-mobile-menu" type="button" aria-label="Mở điều hướng" aria-expanded={mobileOpen} aria-controls="workspace-navigation" onClick={() => setMobileOpen(true)}>
          <List size={23} aria-hidden="true" />
        </button>
        <main id="main" className="workspace-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
