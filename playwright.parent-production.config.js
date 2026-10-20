import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "parent-production.spec.js",
  use: { baseURL: "http://127.0.0.1:4178", channel: "chrome" },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4178",
    url: "http://127.0.0.1:4178",
    reuseExistingServer: false,
  },
});
