import { defineConfig } from "@playwright/test";
import { apiModes, apiSpecs } from "./tests/support/apiModes";

export default defineConfig({
  testDir: "./tests",
  testIgnore: [...apiSpecs, "parent-production.spec.js"],
  fullyParallel: true,
  workers: 3,
  use: {
    baseURL: "http://127.0.0.1:5180",
    channel: "chrome",
    viewport: { width: 1366, height: 768 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5180 --strictPort",
    url: "http://127.0.0.1:5180",
    reuseExistingServer: false,
    env: apiModes("mock"),
  },
});
