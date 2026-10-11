import { featureApiRequest } from "../../../lib/api/featureApi";

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
  listAudit: ({ actor = "all", action = "all", range = "30d", search = "", page = 1, pageSize = 10, signal } = {}) =>
    featureApiRequest("admin", { path: queryPath("/admin/audit", { actor, action, range, search, page, pageSize }), signal }),
};
