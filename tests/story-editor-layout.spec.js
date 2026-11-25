import { test, expect } from "@playwright/test";

test("manager routes fit the viewport and studio timeline remains usable", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);

  for (const width of [1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 768 });
    for (const route of ["", "/stories", "/stories/new", "/assets", "/statistics", ...["", "/roles", "/vocabulary", "/quizzes", "/preview"].map((tab) => `/stories/story-first-spark${tab}`)]) {
      await page.goto(`/content${route}`);
      await expect(page.locator("main h1").first()).toBeVisible();
      await expect(page.locator(".workspace-loading, .story-editor-loading")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}`).toBe(true);
      if (width === 1366 || width === 390) {
        await page.screenshot({ path: `artifacts/editor-regression/manager-${route.replaceAll("/", "-") || "overview"}-${width}.png` });
      }
    }
    await page.goto("/content/stories/story-first-spark/pages");
    await page.getByRole("button", { name: "Đóng bảng công cụ" }).click();
    const timeline = page.locator(".story-timeline");
    await expect(timeline).toBeInViewport({ ratio: 1 });
    await page.getByRole("button", { name: "Thu gọn timeline", exact: true }).click();
    await expect(timeline).toHaveCount(0);
    await page.getByRole("button", { name: "Mở timeline", exact: true }).click();
    await expect(timeline).toBeInViewport({ ratio: 1 });
    await page.getByRole("button", { name: "Thu gọn timeline", exact: true }).click();
    await page.getByRole("button", { name: "Chuyển động", exact: true }).click();
    await expect(timeline).toBeInViewport({ ratio: 1 });
    await page.getByRole("button", { name: "Đóng bảng công cụ" }).click();
    await page.getByRole("button", { name: "Phát thử", exact: true }).click();
    await expect(page.getByRole("button", { name: "Tạm dừng", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
    const stage = page.locator(".story-canvas-stage-wrap > .story-preview-stage");
    await expect(stage).toBeInViewport({ ratio: 1 });
    expect((await stage.boundingBox()).height).toBeGreaterThan(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/editor-regression/layout-${width}.png` });
  }
  expect(errors).toEqual([]);
});
