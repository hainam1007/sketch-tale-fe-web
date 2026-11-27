import { apiRequest } from "../../../lib/api/httpClient";

export const wf05ApiEnabled = import.meta.env.VITE_WF05_MODERATION_API_MODE === "real";

const definitions = {
  restrictedKeywords: {
    path: "/restricted-keywords",
    valueField: "keyword",
    fields: ["keyword", "description", "matchType", "severityLevel", "action", "status"],
  },
  prohibitedThemes: {
    path: "/prohibited-themes",
    valueField: "name",
    fields: ["name", "description", "matchType", "severityLevel", "action", "status"],
  },
};

function definition(kind) {
  const config = definitions[kind];
  if (!config) throw new Error("Loại đề xuất kiểm duyệt không hợp lệ.");
  return config;
}

function rows(response) {
  const values = Array.isArray(response) ? response : response?.items;
  if (!Array.isArray(values) || values.some((item) => !item || typeof item !== "object" || typeof item.id !== "string")) {
    throw new Error("Backend trả danh sách quy tắc kiểm duyệt không đúng định dạng.");
  }
  return values;
}

function cleanPayload(kind, payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => definition(kind).fields.includes(key) && value !== undefined),
  );
}

function request(path, options = {}) {
  if (!wf05ApiEnabled) {
    const error = new Error("WF-05 đang khóa cho tới khi Backend xác nhận quyền truy cập và chỉ áp dụng keyword ở trạng thái Active.");
    error.status = 503;
    error.code = "WF05_API_DISABLED";
    throw error;
  }
  return apiRequest({ ...options, path, forceReal: true });
}

export const moderationRuleService = {
  list: async ({ kind, signal } = {}) => rows(await request(definition(kind).path, { signal })),
  get: ({ kind, id, signal }) => request(`${definition(kind).path}/${encodeURIComponent(id)}`, { signal }),
  create: ({ kind, payload }) => request(definition(kind).path, { method: "POST", body: cleanPayload(kind, payload) }),
  update: ({ kind, id, payload }) => request(`${definition(kind).path}/${encodeURIComponent(id)}`, { method: "PATCH", body: cleanPayload(kind, payload) }),
};

export function moderationOwnerId(item) {
  const value = item?.createBy ?? item?.createdBy ?? item?.CreateBy ?? null;
  return typeof value === "string" && /^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(value) ? null : value;
}

export function isModerationOwner(item, userId) {
  const ownerId = moderationOwnerId(item);
  return typeof ownerId === "string" && typeof userId === "string" && ownerId.toLowerCase() === userId.toLowerCase();
}

export function moderationStatus(item) {
  const value = Number(item?.status);
  return Number.isInteger(value) && value >= 0 && value <= 4 ? value : null;
}

export const moderationRuleStatuses = [
  "Bản nháp",
  "Chờ duyệt",
  "Đang áp dụng",
  "Ngưng áp dụng",
  "Lưu trữ",
];
