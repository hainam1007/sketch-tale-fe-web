import { defineConfig } from "@playwright/test";
import { apiModes } from "./tests/support/apiModes";

export default defineConfig({
  testDir: "./tests", testMatch: "content-integration.spec.js", workers: 1,
  use: { baseURL: "http://127.0.0.1:5191", channel: "chrome", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5191 --strictPort",
    url: "http://127.0.0.1:5191", reuseExistingServer: false,
    env: { ...apiModes("real"), VITE_API_URL: "http://127.0.0.1:5191/api" },
  },
});
