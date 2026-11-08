import { defineConfig } from "@playwright/test";
import editorConfig from "./playwright.editor.config.js";

export default defineConfig({
  ...editorConfig,
  testMatch: "story-editor-garden-gift.spec.js",
  webServer: {
    ...editorConfig.webServer,
    env: { ...editorConfig.webServer.env, VITE_LOCAL_STORY_LIBRARY: "true" },
  },
});
