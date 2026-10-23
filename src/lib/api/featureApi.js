import { mockRequest } from "../../mocks/mockServer";
import { ApiError } from "./errors";
import { apiRequest } from "./httpClient";

export const featureApiModes = Object.freeze({
  // Partial integration is intentional: Admin and Parent operations without a
  // backend contract remain available as labelled mock data in every build.
  admin: import.meta.env.VITE_ADMIN_API_MODE || "mock",
  parent: import.meta.env.VITE_PARENT_API_MODE || "mock",
  content: import.meta.env.VITE_CONTENT_API_MODE || (import.meta.env.VITE_API_MODE === "real" ? "real" : "mock"),
});

// Catalog routes documented by the backend can be used independently from the
// Admin core API, whose users/reports/monitoring endpoints are not available.
// Catalogs default to the configured backend; an explicit mock mode is available.
export const adminCatalogApiMode = import.meta.env.VITE_ADMIN_CATALOG_API_MODE || "real";

export const moduleApiModes = Object.freeze({
  parentProfile: import.meta.env.VITE_PARENT_PROFILE_API_MODE || (import.meta.env.VITE_API_MODE === "real" ? "real" : featureApiModes.parent),
  parentCatalog: import.meta.env.VITE_PARENT_CATALOG_API_MODE || featureApiModes.parent,
  parentSubscription: import.meta.env.VITE_PARENT_SUBSCRIPTION_API_MODE || featureApiModes.parent,
  // Swagger documents list/detail ContentReport operations; keep this module
  // read-only in the UI until status-transition semantics are confirmed.
  adminReports: import.meta.env.VITE_ADMIN_REPORTS_API_MODE || "real",
  adminModerationCatalog: import.meta.env.VITE_ADMIN_MODERATION_CATALOG_API_MODE || adminCatalogApiMode,
});

const featureLabels = {
  admin: "Admin",
  parent: "Parent",
  content: "Content Manager",
  parentProfile: "hồ sơ Parent",
  parentCatalog: "thư viện Parent",
  parentSubscription: "gói Parent",
  adminReports: "báo cáo Admin",
  adminModerationCatalog: "danh mục kiểm duyệt Admin",
};

export function isFeatureMockMode(feature) {
  return featureApiModes[feature] === "mock";
}

export function isModuleMockMode(module) {
  return moduleApiModes[module] === "mock";
}

export function moduleApiRequest(module, options) {
  const mode = moduleApiModes[module];
  if (mode === "real") return apiRequest({ ...options, forceReal: true });
  if (mode === "mock") return mockRequest(options);

  throw new ApiError({
    status: 503,
    code: `${String(module).toUpperCase()}_API_NOT_CONFIGURED`,
    message: `Khu vực ${featureLabels[module] || "này"} chưa được cấu hình API.`,
  });
}

export function featureApiRequest(feature, options) {
  const mode = featureApiModes[feature];
  if (mode === "real") return apiRequest({ ...options, forceReal: true });
  if (mode === "mock") return mockRequest(options);

  throw new ApiError({
    status: 503,
    code: `${String(feature).toUpperCase()}_API_NOT_CONFIGURED`,
    message: `Khu vực ${featureLabels[feature] || "này"} chưa được kết nối với API backend.`,
  });
}

export function adminCatalogApiRequest(options) {
  if (adminCatalogApiMode === "real") return apiRequest({ ...options, forceReal: true });
  if (adminCatalogApiMode === "mock") return mockRequest(options);

  throw new ApiError({
    status: 503,
    code: "ADMIN_CATALOG_API_NOT_CONFIGURED",
    message: "Danh mục Admin chưa được cấu hình cho môi trường này.",
  });
}
