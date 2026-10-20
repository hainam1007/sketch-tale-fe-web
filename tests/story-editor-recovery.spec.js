import { test, expect } from "@playwright/test";

async function openEditor(page) {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);
  await page.goto("/content/stories/story-first-spark/pages");
  if (await page.locator(".story-tool-rail button").first().getAttribute("aria-pressed") !== "true") await page.locator(".story-tool-rail button").first().click();
}

test("upload a background inside the editor and preserve it after saving", async ({ page }) => {
  await openEditor(page);
  const upload = page.getByLabel("Tải lên ảnh nền", { exact: true });
  await upload.setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("invalid") });
  await expect(page.locator(".editor-field-error[role=alert]")).toContainText("Chỉ hỗ trợ PNG");
  await upload.setInputFiles({ name: "inline-background.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64") });
  await expect(page.locator(".asset-picker-selected")).toContainText("inline-background.png");
  await expect(page.locator(".story-canvas-stage-wrap > .story-preview-stage")).toHaveCSS("background-image", /blob:/);
  await page.locator(".story-studio-topbar-actions button").nth(2).click();
  await expect(page.getByRole("button", { name: "Lưu tất cả", exact: true })).toBeDisabled();
  await page.reload();
  if (await page.locator(".story-tool-rail button").first().getAttribute("aria-pressed") !== "true") await page.locator(".story-tool-rail button").first().click();
  await expect(page.locator(".asset-picker-selected")).toContainText("inline-background.png");
  await expect(page.locator(".story-canvas-stage-wrap > .story-preview-stage")).toHaveCSS("background-image", /blob:/);
});

test("undo, redo, branch edit and reload recovery preserve story text", async ({ page }) => {
  await openEditor(page);
  const text = page.getByLabel("Nội dung truyện", { exact: true });
  const original = await text.inputValue();
  await text.fill("A new story draft for recovery");
  await page.locator(".story-studio-undo").click();
  await expect(text).toHaveValue(original);
  await page.locator(".story-studio-topbar-actions button").nth(1).click();
  await expect(text).toHaveValue("A new story draft for recovery");
  await page.locator(".story-studio-undo").click();
  await text.fill("Recovered branch of the story");
  await expect(page.getByRole("button", { name: "Làm lại", exact: true })).toBeDisabled();
  await page.reload();
  await page.locator(".story-recovery-banner button").first().click();
  if (await page.locator(".story-tool-rail button").first().getAttribute("aria-pressed") !== "true") await page.locator(".story-tool-rail button").first().click();
  await expect(text).toHaveValue("Recovered branch of the story");
  await expect(page.locator(".story-page-thumbnail")).not.toHaveCount(0);
  await page.locator(".story-studio-topbar-actions button").nth(2).click();
  await expect(page.getByRole("button", { name: "Lưu tất cả", exact: true })).toBeDisabled();
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("sketchtale.story-draft.v1:")).length)).toBe(0);
  const initialHeight = await page.locator(".story-canvas-stage-wrap").evaluate((element) => element.getBoundingClientRect().height);
  await page.getByRole("button", { name: "Thu gọn timeline" }).click();
  await expect(page.locator(".story-timeline")).toHaveCount(0);
  await expect.poll(() => page.locator(".story-canvas-stage-wrap").evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(initialHeight);
  await page.screenshot({ path: "test-results/story-editor-desktop.png" });
});

test("stale recovery cannot overwrite the current revision", async ({ page }) => {
  await openEditor(page);
  await page.getByLabel("Nội dung truyện", { exact: true }).fill("Older recovered text");
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((item) => item.startsWith("sketchtale.story-draft.v1:"));
    const draft = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify({ ...draft, revision: "stale-revision" }));
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Khôi phục bản nháp", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tải bản sao", exact: true })).toBeVisible();
});
