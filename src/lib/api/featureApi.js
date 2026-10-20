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
// Production uses the configured backend; local development keeps an explicit
// mock by default unless the catalog mode is opted into real.
export const adminCatalogApiMode = import.meta.env.VITE_ADMIN_CATALOG_API_MODE || "real";

const featureLabels = {
  admin: "Admin",
  parent: "Parent",
  content: "Content Manager",
};

export function isFeatureMockMode(feature) {
  return featureApiModes[feature] === "mock";
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
