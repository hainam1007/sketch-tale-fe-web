import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "story-editor-*.spec.js",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5174", channel: "chrome", viewport: { width: 1366, height: 768 }, trace: "retain-on-failure" },
  webServer: { command: "npm run dev -- --host 127.0.0.1 --port 5174", url: "http://127.0.0.1:5174", reuseExistingServer: true, env: { VITE_API_MODE: "mock", VITE_CONTENT_API_MODE: "mock" } },
});
