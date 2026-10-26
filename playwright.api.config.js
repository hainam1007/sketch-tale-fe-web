import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
import { apiModes, apiSpecs } from "./tests/support/apiModes";

export default defineConfig(base, {
  testIgnore: [],
  testMatch: apiSpecs,
  use: { baseURL: "http://127.0.0.1:5181" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5181 --strictPort",
    url: "http://127.0.0.1:5181",
    reuseExistingServer: false,
    env: apiModes("real"),
  },
});
