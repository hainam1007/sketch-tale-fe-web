export const apiSpecs = [
  "confirm-email.spec.js",
  "admin-api-ux.spec.js",
  "parent-live-profiles.spec.js",
  "parent-experience-v2.spec.js",
];

export function apiModes(mode) {
  return {
    VITE_API_URL: "http://127.0.0.1:5181/api",
    VITE_API_MODE: mode,
    VITE_CONTENT_API_MODE: mode,
    VITE_PARENT_API_MODE: "mock",
    VITE_ADMIN_API_MODE: "mock",
    VITE_PARENT_PROFILE_API_MODE: mode,
    VITE_PARENT_CATALOG_API_MODE: mode,
    VITE_PARENT_SUBSCRIPTION_API_MODE: "mock",
    VITE_ADMIN_CATALOG_API_MODE: mode,
    VITE_ADMIN_REPORTS_API_MODE: mode,
    VITE_ADMIN_MODERATION_CATALOG_API_MODE: mode,
  };
}
