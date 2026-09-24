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

export const adminService = {
  listUsers: ({ search = "", role = "all", status = "all", page = 1, pageSize = 10, sort = "name_asc", signal } = {}) =>
    apiRequest({ path: queryPath("/admin/users", { search, role, status, page, pageSize, sort }), signal }),
  getUser: ({ userId, signal }) => apiRequest({ path: `/admin/users/${userId}`, signal }),
  updateUserStatus: ({ userId, status, reason = "", revision, signal }) =>
    apiRequest({ path: `/admin/users/${userId}`, method: "PATCH", body: mutationBody({ status, reason, revision }), signal }),
  listReports: ({ status = "all", search = "", page = 1, pageSize = 10, sort = "updated_desc", signal } = {}) =>
    apiRequest({ path: queryPath("/admin/reports", { status, search, page, pageSize, sort }), signal }),
  getReport: ({ reportId, signal }) => apiRequest({ path: `/admin/reports/${reportId}`, signal }),
  updateReport: ({ reportId, signal, ...payload }) =>
    apiRequest({ path: `/admin/reports/${reportId}`, method: "PATCH", body: mutationBody(payload), signal }),
  getPermissions: ({ signal } = {}) => apiRequest({ path: "/admin/permissions", signal }),
  updatePermission: ({ userId, role, reason = "", revision, signal }) =>
    apiRequest({ path: `/admin/permissions/${userId}`, method: "PATCH", body: mutationBody({ role, reason, revision }), signal }),
  getSystemLimits: ({ signal } = {}) => apiRequest({ path: "/admin/system-limits", signal }),
  updateSystemLimits: ({ signal, ...payload }) =>
    apiRequest({ path: "/admin/system-limits", method: "PATCH", body: mutationBody(payload), signal }),
  listRestrictions: ({ signal } = {}) => apiRequest({ path: "/admin/restrictions", signal }),
  updateRestriction: ({ restrictionId, signal, ...payload }) =>
    apiRequest({ path: `/admin/restrictions/${restrictionId}`, method: "PATCH", body: mutationBody(payload), signal }),
  getMonitoring: ({ signal } = {}) => apiRequest({ path: "/admin/monitoring", signal }),
  monitorAction: ({ jobId, signal, ...payload }) =>
    apiRequest({ path: `/admin/monitoring/${jobId}`, method: "PATCH", body: mutationBody(payload), signal }),
  getStatistics: ({ range = "7d", signal } = {}) => apiRequest({ path: queryPath("/admin/statistics", { range }), signal }),
  listAudit: ({ actor = "all", action = "all", range = "30d", search = "", page = 1, pageSize = 10, signal } = {}) =>
    apiRequest({ path: queryPath("/admin/audit", { actor, action, range, search, page, pageSize }), signal }),
};
