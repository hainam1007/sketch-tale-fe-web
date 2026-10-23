import { test, expect } from "@playwright/test";

test("loading keeps its header above the skeleton without horizontal overflow", async ({ page }) => {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);
  // Hold only the editor request so the actual loading layout can be inspected.
  await page.evaluate(async () => {
    const { contentService } = await import("/src/features/content/services/contentService.js");
    const original = contentService.getEditor;
    contentService.getEditor = async (params) => {
      await new Promise((resolve) => { window.releaseEditorLoading = resolve; });
      return original(params);
    };
    history.pushState({}, "", "/content/stories/story-first-spark/pages");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  const loading = page.locator(".story-editor-loading");
  await expect(loading).toBeVisible();
  for (const width of [1920, 1366, 768, 390]) {
    await page.setViewportSize({ width, height: 850 });
    const header = await page.locator(".story-editor-loading-header").boundingBox();
    const skeleton = await page.locator(".story-editor-loading-studio").boundingBox();
    expect(header.width).toBeGreaterThan(width * 0.65);
    expect(skeleton.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await loading.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/story-loading-${width}.png` });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".story-editor-loading-status > span")).toHaveCSS("animation-name", "none");
  await page.evaluate(() => window.releaseEditorLoading());
  await expect(loading).toHaveCount(0);
  await expect(page.locator(".story-studio-topbar")).toBeVisible();
});
