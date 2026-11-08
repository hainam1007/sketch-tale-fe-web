import { defineConfig } from "@playwright/test";

const environments = [
  { name: "parent-live", port: 5192, profile: "real" },
  { name: "parent-catalog-only", port: 5193, profile: "mock" },
];

export default defineConfig({
  testDir: "./tests",
  testMatch: "parent-integration.spec.js",
  workers: 1,
  timeout: 30_000,
  use: { channel: "chromium", trace: "retain-on-failure" },
  projects: environments.map(({ name, port }) => ({ name, use: { baseURL: `http://127.0.0.1:${port}` } })),
  webServer: environments.map(({ port, profile }) => ({
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: {
      VITE_API_URL: `http://127.0.0.1:${port}/api`,
      VITE_API_MODE: "real",
      VITE_PARENT_API_MODE: "mock",
      VITE_PARENT_PROFILE_API_MODE: profile,
      VITE_PARENT_CATALOG_API_MODE: "real",
      VITE_PARENT_APPROVALS_API_MODE: "real",
    },
  })),
});
