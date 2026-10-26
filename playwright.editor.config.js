import { defineConfig } from "@playwright/test";
import { apiModes } from "./tests/support/apiModes";
export default defineConfig({
  testDir: "./tests",
  testMatch: "story-editor-*.spec.js",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5174", channel: "chrome", viewport: { width: 1366, height: 768 }, trace: "retain-on-failure" },
  webServer: { command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort", url: "http://127.0.0.1:5174", reuseExistingServer: false, env: apiModes("mock") },
});
