import { adminCatalogApiMode, adminCatalogApiRequest } from "../../../lib/api/featureApi";

const definitions = {
  plans: { path: "/subscription-plans", singular: "gói sử dụng" },
  credits: { path: "/credit-costs", singular: "chi phí credit" },
  themes: { path: "/education-themes", singular: "chủ đề giáo dục" },
};

function request(kind, options = {}) {
  const definition = definitions[kind];
  if (!definition) throw new Error("Danh mục Admin không hợp lệ.");
  return adminCatalogApiRequest({ ...options, path: options.id ? `${definition.path}/${encodeURIComponent(options.id)}` : definition.path });
}

function rows(response, label) {
  const items = Array.isArray(response) ? response : response?.items;
  if (!Array.isArray(items)) {
    const error = new Error(`Backend trả về danh sách ${label} không đúng định dạng.`);
    error.code = "ADMIN_CATALOG_RESPONSE_INVALID";
    throw error;
  }
  return items;
}

export const adminCatalogService = {
  mode: adminCatalogApiMode,
  list: async ({ kind, signal }) => rows(await request(kind, { signal }), definitions[kind]?.singular || "danh mục"),
  get: ({ kind, id, signal }) => request(kind, { id, signal }),
  create: ({ kind, payload, signal }) => request(kind, { method: "POST", body: payload, signal }),
  update: ({ kind, id, payload, signal }) => request(kind, { id, method: "PATCH", body: payload, signal }),
  remove: ({ kind, id, signal }) => request(kind, { id, method: "DELETE", signal }),
};
