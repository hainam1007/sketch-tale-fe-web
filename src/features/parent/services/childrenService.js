import { apiRequest } from "../../../lib/api/httpClient";

export const childrenService = {
  list: ({ signal } = {}) => apiRequest({ path: "/children", signal }),
  get: ({ childId, signal }) => apiRequest({ path: `/children/${childId}`, signal }),
  create: (payload) => apiRequest({ path: "/children", method: "POST", body: payload }),
  update: ({ childId, ...payload }) =>
    apiRequest({ path: `/children/${childId}`, method: "PATCH", body: payload }),
  entitlement: ({ signal } = {}) => apiRequest({ path: "/entitlements", signal }),
  dashboard: ({ range = "7d", simulate = "", signal } = {}) => apiRequest({ path: `/parent/dashboard?range=${range}${simulate ? `&simulate=${encodeURIComponent(simulate)}` : ""}`, signal }),
  listExports: ({ status = "all", signal } = {}) => apiRequest({ path: `/parent/exports?status=${status}`, signal }),
  getExport: ({ exportId, signal }) => apiRequest({ path: `/parent/exports/${exportId}`, signal }),
  createExport: (payload) => apiRequest({ path: "/parent/exports", method: "POST", body: payload }),
  retryExport: ({ exportId, revision }) => apiRequest({ path: `/parent/exports/${exportId}`, method: "PATCH", body: { action: "retry", revision } }),
  downloadExport: ({ exportId, signal }) => apiRequest({ path: `/parent/exports/${exportId}/download`, signal }),
  familyReport: ({ signal } = {}) => apiRequest({ path: "/parent/family-report", signal }),
  updateFamilyReportSettings: (payload) => apiRequest({ path: "/parent/family-report/settings", method: "PATCH", body: payload }),
  getProgress: ({ childId, range = "30d", signal }) => apiRequest({ path: `/children/${childId}/progress?range=${range}`, signal }),
  categories: ({ signal } = {}) => apiRequest({ path: "/catalog/categories", signal }),
  getSettings: ({ childId, signal }) => apiRequest({ path: `/children/${childId}/settings`, signal }),
  updateSettings: ({ childId, ...payload }) => apiRequest({ path: `/children/${childId}/settings`, method: "PATCH", body: payload }),
  listApprovals: ({ childId, status = "all", signal }) => apiRequest({ path: `/children/${childId}/approvals?status=${status}`, signal }),
  getApproval: ({ childId, approvalId, signal }) => apiRequest({ path: `/children/${childId}/approvals/${approvalId}`, signal }),
  updateApproval: ({ childId, approvalId, ...payload }) => apiRequest({ path: `/children/${childId}/approvals/${approvalId}`, method: "PATCH", body: payload }),
  listLibrary: ({ childId, type = "all", search = "", signal }) => apiRequest({ path: `/children/${childId}/library?type=${type}&search=${encodeURIComponent(search)}`, signal }),
  updateLibraryItem: ({ childId, itemId, ...payload }) => apiRequest({ path: `/children/${childId}/library/${itemId}`, method: "PATCH", body: payload }),
  deleteLibraryItem: ({ childId, itemId }) => apiRequest({ path: `/children/${childId}/library/${itemId}`, method: "DELETE" }),
};
