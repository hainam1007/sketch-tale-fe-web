import { ROLES, roleLabels } from "../../lib/permissions/roles";

export const ADMIN_PAGE_SIZE = 10;

export const ADMIN_ROLES = [ROLES.PARENT, ROLES.CONTENT, ROLES.ADMIN];

export const adminRoleLabels = {
  ...roleLabels,
};

export const ADMIN_USER_STATUSES = ["active", "locked"];

export const adminUserStatusLabels = {
  active: "Đang hoạt động",
  locked: "Đang khóa",
};

export const ADMIN_REPORT_STATUSES = ["open", "under_review", "resolved", "rejected"];

export const adminReportStatusLabels = {
  open: "Mở",
  under_review: "Đang xem xét",
  resolved: "Đã giải quyết",
  rejected: "Từ chối",
};

export const ADMIN_REPORT_ACTIONS = {
  open: ["start_review"],
  under_review: ["resolve", "reject"],
  resolved: ["reopen"],
  rejected: ["reopen"],
};

export const adminReportActionLabels = {
  start_review: "Nhận xử lý",
  resolve: "Đánh dấu đã giải quyết",
  reject: "Từ chối báo cáo",
  reopen: "Mở lại báo cáo",
};

export const adminRoleOptions = ADMIN_ROLES.map((value) => ({
  value,
  label: adminRoleLabels[value] || value,
}));

export function normalizePage(value, fallback = 1) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : fallback;
}

export function normalizePageSize(value, fallback = ADMIN_PAGE_SIZE) {
  const pageSize = Number(value);
  return Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 50) : fallback;
}

export function normalizeAdminListResponse(response) {
  const page = normalizePage(response?.page);
  const pageSize = normalizePageSize(response?.pageSize);
  const total = Number.isFinite(response?.total) ? response.total : response?.items?.length || 0;
  return {
    ...response,
    items: Array.isArray(response?.items) ? response.items : [],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function isConflictError(error) {
  return error?.status === 409 || error?.code === "REVISION_CONFLICT";
}
