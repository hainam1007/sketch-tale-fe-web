import { mockRequest } from "../../mocks/mockServer";
import { ApiError } from "./errors";
import { apiRequest } from "./httpClient";

const isDevelopment = import.meta.env.DEV;

export const featureApiModes = Object.freeze({
  admin: import.meta.env.VITE_ADMIN_API_MODE || (isDevelopment ? "mock" : "unavailable"),
  parent: import.meta.env.VITE_PARENT_API_MODE || (isDevelopment ? "mock" : "unavailable"),
  content: import.meta.env.VITE_CONTENT_API_MODE || (isDevelopment ? "mock" : "unavailable"),
});

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
  if (mode === "real") return apiRequest(options);
  if (mode === "mock") return mockRequest(options);

  throw new ApiError({
    status: 503,
    code: `${String(feature).toUpperCase()}_API_NOT_CONFIGURED`,
    message: `Khu vực ${featureLabels[feature] || "này"} chưa được kết nối với API backend.`,
  });
}
