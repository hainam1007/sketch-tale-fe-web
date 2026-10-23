import { featureApiRequest, moduleApiModes } from "../../../lib/api/featureApi";
import { parentCatalogService } from "./parentCatalogService";

export const childrenService = {
  storyCatalog: ({ signal } = {}) => moduleApiModes.parentCatalog === "real"
    ? parentCatalogService.list({ signal })
    : featureApiRequest("parent", { path: "/parent/stories", signal }),
  catalogStory: ({ storyId, signal }) => parentCatalogService.get({ storyId, signal }),
  recommendStory: ({ childId, storyId }) => featureApiRequest("parent", { path: `/children/${childId}/recommendations`, method: "POST", body: { storyId } }),
  list: ({ signal } = {}) => featureApiRequest("parent", { path: "/children", signal }),
  get: ({ childId, signal }) => featureApiRequest("parent", { path: `/children/${childId}`, signal }),
  create: (payload) => featureApiRequest("parent", { path: "/children", method: "POST", body: payload }),
  update: ({ childId, ...payload }) =>
    featureApiRequest("parent", { path: `/children/${childId}`, method: "PATCH", body: payload }),
  entitlement: ({ signal } = {}) => featureApiRequest("parent", { path: "/entitlements", signal }),
  dashboard: ({ childId, range = "7d", simulate = "", signal } = {}) => featureApiRequest("parent", { path: childId ? `/children/${childId}/dashboard?range=${range}${simulate ? `&simulate=${encodeURIComponent(simulate)}` : ""}` : `/parent/dashboard?range=${range}${simulate ? `&simulate=${encodeURIComponent(simulate)}` : ""}`, signal }),
  listExports: ({ status = "all", childId = "", signal } = {}) => featureApiRequest("parent", { path: `/parent/exports?status=${status}${childId ? `&childId=${encodeURIComponent(childId)}` : ""}`, signal }),
  getExport: ({ exportId, signal }) => featureApiRequest("parent", { path: `/parent/exports/${exportId}`, signal }),
  createExport: (payload) => featureApiRequest("parent", { path: "/parent/exports", method: "POST", body: payload }),
  retryExport: ({ exportId, revision }) => featureApiRequest("parent", { path: `/parent/exports/${exportId}`, method: "PATCH", body: { action: "retry", revision } }),
  downloadExport: ({ exportId, signal }) => featureApiRequest("parent", { path: `/parent/exports/${exportId}/download`, signal }),
  familyReport: ({ signal } = {}) => featureApiRequest("parent", { path: "/parent/family-report", signal }),
  updateFamilyReportSettings: (payload) => featureApiRequest("parent", { path: "/parent/family-report/settings", method: "PATCH", body: payload }),
  getProgress: ({ childId, range = "30d", signal }) => featureApiRequest("parent", { path: `/children/${childId}/progress?range=${range}`, signal }),
  categories: ({ signal } = {}) => featureApiRequest("parent", { path: "/catalog/categories", signal }),
  getSettings: ({ childId, signal }) => featureApiRequest("parent", { path: `/children/${childId}/settings`, signal }),
  updateSettings: ({ childId, ...payload }) => featureApiRequest("parent", { path: `/children/${childId}/settings`, method: "PATCH", body: payload }),
  listApprovals: ({ childId, status = "all", signal }) => featureApiRequest("parent", { path: `/children/${childId}/approvals?status=${status}`, signal }),
  getApproval: ({ childId, approvalId, signal }) => featureApiRequest("parent", { path: `/children/${childId}/approvals/${approvalId}`, signal }),
  updateApproval: ({ childId, approvalId, ...payload }) => featureApiRequest("parent", { path: `/children/${childId}/approvals/${approvalId}`, method: "PATCH", body: payload }),
  updateSensitiveRolePermission: ({ childId, approvalId, ...payload }) => featureApiRequest("parent", { path: `/children/${childId}/approvals/${approvalId}/sensitive-role`, method: "PATCH", body: payload }),
  listLibrary: ({ childId, type = "all", search = "", signal }) => featureApiRequest("parent", { path: `/children/${childId}/library?type=${type}&search=${encodeURIComponent(search)}`, signal }),
  updateLibraryItem: ({ childId, itemId, ...payload }) => featureApiRequest("parent", { path: `/children/${childId}/library/${itemId}`, method: "PATCH", body: payload }),
  deleteLibraryItem: ({ childId, itemId }) => featureApiRequest("parent", { path: `/children/${childId}/library/${itemId}`, method: "DELETE" }),
};
