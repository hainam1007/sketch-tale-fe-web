import { Outlet, useLocation } from "react-router-dom";
import FamilyProfilesStatus from "../components/FamilyProfilesStatus";
import { getFamilyProfilePreview, showFamilyProfilePreview } from "../components/FamilyProfilesPreview";

const availableParentRoutes = new Set([
  "/parent",
  "/parent/children",
  "/parent/children/new",
  "/parent/plan",
  "/parent/checkout",
]);

export default function ParentAvailabilityGate() {
  const { pathname } = useLocation();
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const previewDetailMatch = normalizedPath.match(/^\/parent\/children\/([^/]+)$/);
  const isPreviewDetail = showFamilyProfilePreview && previewDetailMatch && getFamilyProfilePreview(previewDetailMatch[1]);

  if (availableParentRoutes.has(normalizedPath) || isPreviewDetail) return <Outlet />;

  return (
    <div className="parent-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH</p>
          <h1>Không gian của gia đình</h1>
          <p>Thông tin từng bé sẽ tập trung tại đây để bạn tiện theo dõi và đồng hành.</p>
        </div>
      </div>
      <FamilyProfilesStatus
        title="Khu vực này sẽ mở cùng hồ sơ của bé"
        message="Quay lại danh sách hồ sơ để tiếp tục quản lý tài khoản của gia đình."
      />
    </div>
  );
}
