import { Outlet, useLocation } from "react-router-dom";
import ParentChildExperience from "../pages/ParentChildExperience";
import FamilyReportsDemo from "../pages/FamilyReportsDemo";
import { getFamilyProfilePreview, showFamilyProfilePreview } from "../services/familyProfilePreview";
import { moduleApiModes } from "../../../lib/api/featureApi";

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
  const isLiveCatalog = normalizedPath === "/parent/library" && moduleApiModes.parentCatalog === "real";

  const childMatch = normalizedPath.match(/^\/parent\/children\/([^/]+)(?:\/([^/]+))?$/);
  if (childMatch && childMatch[1] !== "new" && moduleApiModes.parentProfile === "real") {
    const childId = decodeURIComponent(childMatch[1]);
    return <ParentChildExperience key={childId} childId={childId} section={childMatch[2] || ""} />;
  }
  if (["/parent/reports", "/parent/exports"].includes(normalizedPath)) return <FamilyReportsDemo exports={normalizedPath.endsWith("exports")} />;
  if (availableParentRoutes.has(normalizedPath) || isPreviewDetail || isLiveCatalog) return <Outlet />;
  return <Outlet />;
}
