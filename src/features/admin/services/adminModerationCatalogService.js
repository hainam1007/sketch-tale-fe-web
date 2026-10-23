import { moduleApiRequest } from "../../../lib/api/featureApi";

const definitions = {
  charTypes: { path: "/char-types", fields: ["name", "description", "status"] },
  prohibitedThemes: { path: "/prohibited-themes", fields: ["name", "description", "matchType", "severityLevel", "action", "status"] },
};

function definition(kind) {
  const value = definitions[kind];
  if (!value) throw new Error("Danh mục kiểm duyệt không hợp lệ.");
  return value;
}

function payloadFor(kind, payload) {
  const allowed = new Set(definition(kind).fields);
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => allowed.has(key) && value !== undefined && !(enumFields.has(key) && value === "")));
}

const enumFields = new Set(["status", "matchType", "severityLevel", "action"]);

function request(path, options = {}) {
  return moduleApiRequest("adminModerationCatalog", { ...options, path });
}

function rows(response) {
  const items = Array.isArray(response) ? response : response?.items;
  if (!Array.isArray(items) || items.some((item) => !item || typeof item !== "object" || Array.isArray(item) || typeof item.id !== "string")) {
    throw new Error("Backend trả danh mục kiểm duyệt không đúng định dạng.");
  }
  return items;
}

export const adminModerationCatalogService = {
  list: async ({ kind, signal }) => rows(await request(definition(kind).path, { signal })),
  get: ({ kind, id, signal }) => request(`${definition(kind).path}/${encodeURIComponent(id)}`, { signal }),
  create: ({ kind, payload }) => request(definition(kind).path, { method: "POST", body: payloadFor(kind, payload) }),
  update: ({ kind, id, payload }) => request(`${definition(kind).path}/${encodeURIComponent(id)}`, { method: "PATCH", body: payloadFor(kind, payload) }),
  remove: ({ kind, id }) => request(`${definition(kind).path}/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
