import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChartLineUp,
  Coins,
  GraduationCap,
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
import { useConfirmToast } from "../../components/feedback/useConfirmToast";
import { ROLES, roleHome, roleLabels } from "../../lib/permissions/roles";
import { isFeatureMockMode } from "../../lib/api/featureApi";
import { approveNextContentEditorNavigation, isContentEditorDirty, shouldConfirmContentEditorNavigation } from "../../features/content/hooks/useEditorSaveState";
import "./workspace.css";
import "../../features/content/content.css";
import "../../features/parent/parent.css";
import "../../features/admin/admin.css";

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
    { to: "/admin/subscription-plans", label: "Gói sử dụng", icon: Package },
    { to: "/admin/credit-costs", label: "Chi phí credit", icon: Coins },
    { to: "/admin/education-themes", label: "Chủ đề giáo dục", icon: GraduationCap },
  ],
};

export default function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const confirmToast = useConfirmToast();
  const isStoryStudio = user.role === ROLES.CONTENT && /\/content\/stories\/[^/]+\/pages\/?$/.test(location.pathname);
  const isStoryEditorRoute = /^\/content\/stories\/(?!new(?:\/|$))[^/]+/.test(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigation = roleNavigation[user.role] || roleNavigation[ROLES.PARENT];
  const isAdminCatalogPage = user.role === ROLES.ADMIN && /^\/admin\/(subscription-plans|credit-costs|education-themes)$/.test(location.pathname);

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

  async function handleWorkspaceNavigation(event, to) {
    if (!shouldConfirmContentEditorNavigation(event)) { closeMobile(); return; }
    if (isStoryEditorRoute) { closeMobile(); return; }
    event.preventDefault();
    if (await confirmToast({ title: "Rời trang này?", message: "Bạn có thay đổi chưa lưu. Nếu rời trang, các thay đổi này sẽ bị bỏ.", confirmLabel: "Rời trang", cancelLabel: "Ở lại", tone: "danger" })) {
      navigate(to);
      closeMobile();
    }
  }

  async function handleLogout() {
    const dirty = isContentEditorDirty();
    if (dirty && !await confirmToast({ title: "Đăng xuất?", message: "Bạn có thay đổi chưa lưu. Nếu rời trang, các thay đổi này sẽ bị bỏ.", confirmLabel: "Đăng xuất", cancelLabel: "Ở lại", tone: "danger" })) return;
    if (dirty && isStoryEditorRoute) approveNextContentEditorNavigation();
    navigate("/", { replace: true });
    if (dirty && isStoryEditorRoute) await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
    await logout();
  }

  return (
    <div className={`workspace-app ${user.role === ROLES.PARENT ? "workspace-app-parent" : ""} ${user.role === ROLES.CONTENT ? "workspace-app-content" : ""} ${user.role === ROLES.ADMIN ? "workspace-app-admin" : ""}${isStoryStudio ? " workspace-app-studio" : ""}`}>
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
            <NavLink key={to} to={to} end={end} onClick={(event) => { void handleWorkspaceNavigation(event, to); }}>
              <Icon size={20} aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="workspace-sidebar-bottom">
          <NavLink to="/profile" onClick={(event) => { void handleWorkspaceNavigation(event, "/profile"); }}>
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
          {user.role === ROLES.ADMIN && !isAdminCatalogPage && isFeatureMockMode("admin") && <div className="admin-demo-banner" role="status"><span aria-hidden="true" /> Một số tính năng quản trị dùng Dữ liệu mô phỏng; từng khu vực hiển thị nhãn nguồn dữ liệu.</div>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
