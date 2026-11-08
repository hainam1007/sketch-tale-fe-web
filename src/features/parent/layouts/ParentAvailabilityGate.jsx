import { Outlet, useLocation } from "react-router-dom";
import {
  getFamilyProfilePreview,
  showFamilyProfilePreview,
} from "../services/familyProfilePreview";
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
  const previewDetailMatch = normalizedPath.match(
    /^\/parent\/children\/([^/]+)$/,
  );
  const isPreviewDetail =
    showFamilyProfilePreview &&
    previewDetailMatch &&
    getFamilyProfilePreview(previewDetailMatch[1]);
  const isLiveCatalog =
    normalizedPath === "/parent/library" &&
    moduleApiModes.parentCatalog === "real";

  if (
    availableParentRoutes.has(normalizedPath) ||
    isPreviewDetail ||
    isLiveCatalog
  )
    return <Outlet />;
  return <Outlet />;
}
