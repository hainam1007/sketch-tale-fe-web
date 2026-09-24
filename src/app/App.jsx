import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import PublicLayout from "../features/public/layouts/PublicLayout";
import HomePage from "../features/public/pages/HomePage";
import ContactPage from "../features/public/pages/ContactPage";
import {
  AboutPage,
  FaqPage,
  NotFoundPage,
  PolicyPage,
} from "../features/public/pages/InfoPages";
import AuthPage from "../features/auth/pages/AuthPage";
import ForbiddenPage from "../features/auth/pages/ForbiddenPage";
import AppProviders from "./providers/AppProviders";
import RequireAuth from "./router/RequireAuth";
import RequireRole from "./router/RequireRole";
import WorkspaceLayout from "./layouts/WorkspaceLayout";
import ParentOverviewPage from "../features/parent/pages/ParentOverviewPage";
import ChildrenPage from "../features/parent/pages/ChildrenPage";
import NewChildPage from "../features/parent/pages/NewChildPage";
import ChildDetailPage from "../features/parent/pages/ChildDetailPage";
import ChildSettingsPage from "../features/parent/pages/ChildSettingsPage";
import ChildApprovalsPage from "../features/parent/pages/ChildApprovalsPage";
import ChildLibraryPage from "../features/parent/pages/ChildLibraryPage";
import ChildProgressPage from "../features/parent/pages/ChildProgressPage";
import ParentPlanPage from "../features/parent/pages/ParentPlanPage";
import ChildWorkspaceLayout from "../features/parent/layouts/ChildWorkspaceLayout";
import ParentExportsPage from "../features/parent/pages/ParentExportsPage";
import ProfilePage from "../features/profile/pages/ProfilePage";
import RoleOverviewPage from "../features/workspace/pages/RoleOverviewPage";
import AdminUsersPage from "../features/admin/pages/AdminUsersPage";
import AdminUserDetailPage from "../features/admin/pages/AdminUserDetailPage";
import AdminReportsPage from "../features/admin/pages/AdminReportsPage";
import AdminReportDetailPage from "../features/admin/pages/AdminReportDetailPage";
import AdminPermissionsPage from "../features/admin/pages/AdminPermissionsPage";
import AdminSystemLimitsPage from "../features/admin/pages/AdminSystemLimitsPage";
import AdminRestrictionsPage from "../features/admin/pages/AdminRestrictionsPage";
import AdminMonitoringPage from "../features/admin/pages/AdminMonitoringPage";
import ContentStoriesPage from "../features/content/pages/ContentStoriesPage";
import StoryEditorPage from "../features/content/pages/StoryEditorPage";
import StoryEditorLayout from "../features/content/layouts/StoryEditorLayout";
import StoryMetadataPage from "../features/content/pages/StoryMetadataPage";
import StoryPagesPage from "../features/content/pages/StoryPagesPage";
import StoryRolesPage from "../features/content/pages/StoryRolesPage";
import StoryVocabularyPage from "../features/content/pages/StoryVocabularyPage";
import StoryQuizPage from "../features/content/pages/StoryQuizPage";
import StoryPreviewPage from "../features/content/pages/StoryPreviewPage";
import AssetsPage from "../features/content/pages/AssetsPage";
import ContentStatisticsPage from "../features/content/pages/ContentStatisticsPage";
import AdminStatisticsPage from "../features/admin/pages/AdminStatisticsPage";
import AdminAuditPage from "../features/admin/pages/AdminAuditPage";
import { ROLES } from "../lib/permissions/roles";

const titles = {
  "/": "Mỗi nét vẽ, một câu chuyện",
  "/faq": "Những điều bố mẹ muốn biết",
  "/contact": "Liên hệ",
  "/about": "Về SketchTale",
  "/privacy": "Quyền riêng tư - Bản nháp",
  "/terms": "Điều khoản - Bản nháp",
  "/child-safety": "Đồng hành cùng bé",
  "/auth/login": "Đăng nhập minh họa",
  "/auth/register": "Đăng ký minh họa",
  "/auth/forgot-password": "Quên mật khẩu minh họa",
  "/403": "Không đủ quyền",
};

function titleForPath(pathname) {
  if (titles[pathname]) return titles[pathname];
  if (pathname === "/parent") return "Tổng quan Parent";
  if (pathname === "/parent/exports") return "Xuất truyện và báo cáo";
  if (pathname.includes("/parent/children")) return "Hồ sơ bé";
  if (pathname.startsWith("/parent")) return "Parent Portal";
  if (pathname === "/content") return "Tổng quan Content Manager";
  if (pathname.startsWith("/content")) return "Content Manager";
  if (pathname === "/admin") return "Tổng quan Admin";
  if (pathname.startsWith("/admin")) return "Admin Control Room";
  if (pathname === "/profile") return "Hồ sơ tài khoản";
  return "Không tìm thấy trang";
}
function RouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = `SketchTale — ${titleForPath(pathname)}`;
    const frame = requestAnimationFrame(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
      else {
        window.scrollTo(0, 0);
        document.getElementById("main")?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}
export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <RouteEffects />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="403" element={<ForbiddenPage />} />
            {["privacy", "terms", "child-safety"].map((path) => <Route key={path} path={path} element={<PolicyPage path={`/${path}`} />} />)}
            {["login", "register", "forgot-password"].map((mode) => <Route key={mode} path={`auth/${mode}`} element={<AuthPage key={mode} mode={mode} />} />)}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<WorkspaceLayout />}>
              <Route path="profile" element={<ProfilePage />} />
              <Route element={<RequireRole roles={[ROLES.PARENT]} />}>
                <Route path="parent" element={<ParentOverviewPage />} />
                <Route path="parent/children" element={<ChildrenPage />} />
                <Route path="parent/children/new" element={<NewChildPage />} />
                <Route path="parent/children/:childId" element={<ChildWorkspaceLayout />}>
                  <Route index element={<ChildDetailPage />} />
                  <Route path="settings" element={<ChildSettingsPage />} />
                  <Route path="approvals" element={<ChildApprovalsPage />} />
                  <Route path="library" element={<ChildLibraryPage />} />
                  <Route path="progress" element={<ChildProgressPage />} />
                </Route>
                <Route path="parent/plan" element={<ParentPlanPage />} />
                <Route path="parent/exports" element={<ParentExportsPage />} />
              </Route>
              <Route element={<RequireRole roles={[ROLES.CONTENT]} />}>
                <Route path="content" element={<RoleOverviewPage role={ROLES.CONTENT} />} />
                <Route path="content/stories" element={<ContentStoriesPage />} />
                <Route path="content/stories/new" element={<StoryEditorPage mode="new" />} />
                <Route path="content/stories/:storyId" element={<StoryEditorLayout />}>
                  <Route index element={<StoryMetadataPage />} />
                  <Route path="pages" element={<StoryPagesPage />} />
                  <Route path="roles" element={<StoryRolesPage />} />
                  <Route path="vocabulary" element={<StoryVocabularyPage />} />
                  <Route path="quizzes" element={<StoryQuizPage />} />
                  <Route path="preview" element={<StoryPreviewPage />} />
                </Route>
                <Route path="content/assets" element={<AssetsPage />} />
                <Route path="content/statistics" element={<ContentStatisticsPage />} />
              </Route>
              <Route element={<RequireRole roles={[ROLES.ADMIN]} />}>
                <Route path="admin" element={<RoleOverviewPage role={ROLES.ADMIN} />} />
                <Route path="admin/users" element={<AdminUsersPage />} />
                <Route path="admin/users/:userId" element={<AdminUserDetailPage />} />
                <Route path="admin/reports" element={<AdminReportsPage />} />
                <Route path="admin/reports/:reportId" element={<AdminReportDetailPage />} />
                <Route path="admin/permissions" element={<AdminPermissionsPage />} />
                <Route path="admin/system-limits" element={<AdminSystemLimitsPage />} />
                <Route path="admin/restrictions" element={<AdminRestrictionsPage />} />
                <Route path="admin/monitoring" element={<AdminMonitoringPage />} />
                <Route path="admin/statistics" element={<AdminStatisticsPage />} />
                <Route path="admin/audit" element={<AdminAuditPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
