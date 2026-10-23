import { test, expect } from "@playwright/test";

test("editor tools and section navigation remain reachable across viewports", async ({ page }) => {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);
  await page.goto("/content/stories/story-first-spark/pages");
  await expect(page.getByLabel("Tên trang", { exact: true })).toBeVisible();
  for (const width of [1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 850 });
    await page.getByRole("button", { name: "Đóng bảng công cụ" }).click();
    const stage = page.locator(".story-canvas-stage-wrap > .story-preview-stage");
    await expect(stage).toBeVisible();
    expect((await stage.boundingBox()).height).toBeGreaterThan(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator(".story-studio-section-menu summary").click();
    const link = page.getByRole("navigation", { name: "Chuyển phần chỉnh sửa" }).getByRole("link", { name: "Thông tin truyện" });
    await expect(link).toBeVisible();
    await link.click({ trial: true });
    await page.locator(".story-studio-section-menu summary").click();
    await page.screenshot({ path: `artifacts/story-editor-${width}.png` });
    await page.getByRole("button", { name: "Cảnh", exact: true }).click();
    await expect(page.getByLabel("Tên trang", { exact: true })).toBeVisible();
    await page.getByLabel("Tên trang", { exact: true }).click({ trial: true });
  }
  const text = page.getByLabel("Nội dung truyện", { exact: true });
  await text.fill("Một mầm cây thức dậy sau cơn mưa.");
  await expect(page.locator(".story-studio-identity [role=status]")).toHaveText("Đã lưu");
  await page.reload();
  await expect(page.getByLabel("Nội dung truyện", { exact: true })).toHaveValue("Một mầm cây thức dậy sau cơn mưa.");
  await page.screenshot({ path: "artifacts/story-editor-mobile-writing.png" });
});
