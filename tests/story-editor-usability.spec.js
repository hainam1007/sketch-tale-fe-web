import { test, expect } from "@playwright/test";

async function login(page) {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);
}

test("metadata saves with keyboard, protects unsaved edits, and fits laptop and mobile", async ({ page }) => {
  await login(page);
  await page.goto("/content/stories/story-first-spark");
  const originalStatus = await page.locator(".story-editor-title-row .workspace-badge").textContent();
  const save = page.getByRole("button", { name: "Lưu thông tin truyện" });
  await expect(save).toBeDisabled();
  await page.locator("#story-title").fill("Khu vườn của người kể chuyện");
  await expect(save).toBeEnabled();
  await page.keyboard.press("Control+s");
  await expect(save).toBeDisabled();
  await expect(page.locator(".story-editor-title-row h1")).toHaveText("Khu vườn của người kể chuyện");
  await page.reload();
  await expect(page.locator("#story-title")).toHaveValue("Khu vườn của người kể chuyện");
  await expect(page.locator(".story-editor-title-row .workspace-badge")).toHaveText(originalStatus);
  await expect(page.locator("#story-category")).toBeEnabled();
  await expect(page.locator(".asset-picker-open")).toBeEnabled();
  for (const width of [1366, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator("#story-title")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/editor-usability-${width}.png`, fullPage: true });
  }
  await page.locator("#story-description").fill("Nội dung chưa lưu cần được giữ lại.");
  await page.getByRole("button", { name: "Sang dựng truyện" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Ở lại", exact: true }).click();
  await expect(page.locator("#story-description")).toHaveValue("Nội dung chưa lưu cần được giữ lại.");
});

test("motion effects can be found without Vietnamese accents", async ({ page }) => {
  await login(page);
  await page.goto("/content/stories/story-first-spark/pages");
  await page.getByRole("button", { name: "Chuyển động", exact: true }).click();
  await expect(page.locator(".story-preset-grid button")).toHaveCount(20);
  await page.getByLabel("Tìm hiệu ứng").fill("truot");
  await expect(page.locator(".story-preset-grid button")).toHaveCount(3);
  await page.getByLabel("Tìm hiệu ứng").fill("khong-co-hieu-ung");
  await expect(page.getByText("Không tìm thấy hiệu ứng. Thử từ khóa khác.")).toBeVisible();
  await page.getByLabel("Tìm hiệu ứng").fill("");
  await expect(page.locator(".story-preset-grid button")).toHaveCount(20);
});

test("slow category loading does not block typing or discard the draft", async ({ page }) => {
  await login(page);
  await page.evaluate(async () => {
    const { contentService } = await import("/src/features/content/services/contentService.js");
    const original = contentService.listCategories;
    contentService.listCategories = () => new Promise((resolve) => {
      window.resolveEditorCategories = async () => resolve(await original());
    });
  });
  // Client navigation retains the delayed service implementation.
  await page.getByRole("link", { name: "Truyện", exact: true }).click();
  await page.locator('a[href="/content/stories/story-first-spark"]').first().click();
  await expect(page.locator("#story-category")).toBeDisabled();
  await page.locator("#story-title").fill("Bản thảo khi đang tải");
  await expect(page.getByRole("button", { name: "Lưu thông tin truyện" })).toBeDisabled();
  await page.evaluate(() => window.resolveEditorCategories());
  await expect(page.locator("#story-category")).toBeEnabled();
  await expect(page.locator("#story-title")).toHaveValue("Bản thảo khi đang tải");
  await expect(page.getByRole("button", { name: "Lưu thông tin truyện" })).toBeEnabled();
});
