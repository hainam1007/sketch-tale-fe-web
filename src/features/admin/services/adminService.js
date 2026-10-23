import { featureApiRequest, moduleApiRequest } from "../../../lib/api/featureApi";
import { apiRequest } from "../../../lib/api/httpClient";

function queryPath(path, params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function mutationBody(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function normalizeAudit(item) {
  return item && typeof item === "object" ? { ...item, action: item.auditAction ?? item.action ?? null } : item;
}

export const adminService = {
  getOverview: ({ signal } = {}) => featureApiRequest("admin", { path: "/admin/overview", signal }),
  listUsers: ({ search = "", role = "all", status = "all", page = 1, pageSize = 10, sort = "name_asc", signal } = {}) =>
    featureApiRequest("admin", { path: queryPath("/admin/users", { search, role, status, page, pageSize, sort }), signal }),
  getUser: ({ userId, signal }) => featureApiRequest("admin", { path: `/admin/users/${userId}`, signal }),
  updateUserStatus: ({ userId, status, reason = "", revision, signal }) =>
    featureApiRequest("admin", { path: `/admin/users/${userId}`, method: "PATCH", body: mutationBody({ status, reason, revision }), signal }),
  listReports: ({ status = "all", search = "", page = 1, pageSize = 10, sort = "updated_desc", signal } = {}) =>
    featureApiRequest("admin", { path: queryPath("/admin/reports", { status, search, page, pageSize, sort }), signal }),
  getReport: ({ reportId, signal }) => featureApiRequest("admin", { path: `/admin/reports/${reportId}`, signal }),
  updateReport: ({ reportId, signal, ...payload }) =>
    featureApiRequest("admin", { path: `/admin/reports/${reportId}`, method: "PATCH", body: mutationBody(payload), signal }),
  listContentReports: async ({ signal } = {}) => {
    const response = await moduleApiRequest("adminReports", { path: "/content-reports", signal });
    const items = Array.isArray(response) ? response : response?.items;
    if (!Array.isArray(items) || items.some((item) => !item || typeof item !== "object" || Array.isArray(item) || typeof item.id !== "string")) {
      throw new Error("Backend trả danh sách báo cáo nội dung không đúng định dạng.");
    }
    return items;
  },
  getContentReport: ({ reportId, signal }) => moduleApiRequest("adminReports", { path: `/content-reports/${encodeURIComponent(reportId)}`, signal }),
  getPermissions: ({ signal } = {}) => featureApiRequest("admin", { path: "/admin/permissions", signal }),
  updatePermission: ({ userId, role, reason = "", revision, signal }) =>
    featureApiRequest("admin", { path: `/admin/permissions/${userId}`, method: "PATCH", body: mutationBody({ role, reason, revision }), signal }),
  getSystemLimits: ({ signal } = {}) => featureApiRequest("admin", { path: "/admin/system-limits", signal }),
  updateSystemLimits: ({ signal, ...payload }) =>
    featureApiRequest("admin", { path: "/admin/system-limits", method: "PATCH", body: mutationBody(payload), signal }),
  listRestrictions: ({ signal } = {}) => featureApiRequest("admin", { path: "/admin/restrictions", signal }),
  updateRestriction: ({ restrictionId, signal, ...payload }) =>
    featureApiRequest("admin", { path: `/admin/restrictions/${restrictionId}`, method: "PATCH", body: mutationBody(payload), signal }),
  getMonitoring: ({ signal } = {}) => featureApiRequest("admin", { path: "/admin/monitoring", signal }),
  monitorAction: ({ jobId, signal, ...payload }) =>
    featureApiRequest("admin", { path: `/admin/monitoring/${jobId}`, method: "PATCH", body: mutationBody(payload), signal }),
  getStatistics: ({ range = "7d", signal } = {}) => featureApiRequest("admin", { path: queryPath("/admin/statistics", { range }), signal }),
  // These read-only operations exist in Swagger. Keep the remaining Admin
  // service calls on the mock adapter until their endpoints are implemented.
  listAudit: async ({ scope = "all", value = "", signal } = {}) => {
    const scopes = { user: "user-id", entity: "entity-name", target: "entity-id" };
    const path = scopes[scope] && value.trim() ? `/audit-logs/${scopes[scope]}/${encodeURIComponent(value.trim())}` : "/audit-logs";
    const response = await apiRequest({ path, signal, forceReal: true });
    if (Array.isArray(response)) return response.map(normalizeAudit);
    if (Array.isArray(response?.items)) return response.items.map(normalizeAudit);
    throw new Error("Backend trả nhật ký thao tác không đúng định dạng.");
  },
  getAudit: async ({ auditId, signal }) => normalizeAudit(await apiRequest({ path: `/audit-logs/${encodeURIComponent(auditId)}`, signal, forceReal: true })),
  listRestrictedKeywords: async ({ signal } = {}) => {
    const response = await apiRequest({ path: "/restricted-keywords", signal, forceReal: true });
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.items)) return response.items;
    throw new Error("Backend trả danh sách từ khóa hạn chế không đúng định dạng.");
  },
  getRestrictedKeyword: ({ keywordId, signal }) => apiRequest({ path: `/restricted-keywords/${encodeURIComponent(keywordId)}`, signal, forceReal: true }),
  createRestrictedKeyword: ({ payload, signal }) => apiRequest({ path: "/restricted-keywords", method: "POST", body: payload, signal, forceReal: true }),
  updateRestrictedKeyword: ({ keywordId, payload, signal }) => apiRequest({ path: `/restricted-keywords/${encodeURIComponent(keywordId)}`, method: "PATCH", body: payload, signal, forceReal: true }),
  deleteRestrictedKeyword: ({ keywordId, signal }) => apiRequest({ path: `/restricted-keywords/${encodeURIComponent(keywordId)}`, method: "DELETE", signal, forceReal: true }),
};
