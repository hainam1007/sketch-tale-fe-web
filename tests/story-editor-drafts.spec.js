import { test, expect } from "@playwright/test";

async function login(page) {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);
}

test("reselecting a word and deleting another word preserve the unsaved draft", async ({ page }) => {
  await login(page);
  await page.goto("/content/stories/story-first-spark/vocabulary");
  for (const word of ["Alpha regression", "Beta regression"]) {
    await page.locator("#story-editor-vocabulary-word").fill(word);
    await page.locator("#story-editor-vocabulary-meaning").fill("Meaning for regression");
    await page.getByRole("button", { name: "Thêm từ", exact: true }).click();
    await expect(page.getByRole("heading", { name: word, exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Sửa từ Alpha regression", exact: true }).click();
  await page.locator("#story-editor-vocabulary-word").fill("Unsaved alpha draft");
  await page.getByRole("button", { name: "Sửa từ Alpha regression", exact: true }).click();
  await expect(page.locator("#story-editor-vocabulary-word")).toHaveValue("Unsaved alpha draft");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Xóa từ Beta regression", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Xóa từ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Beta regression", exact: true })).toHaveCount(0);
  await expect(page.locator("#story-editor-vocabulary-word")).toHaveValue("Unsaved alpha draft");
  await page.getByRole("button", { name: "Lưu từ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Unsaved alpha draft", exact: true })).toBeVisible();
});

test("metadata uploads and saves a cover, then cancels with one confirmation", async ({ page }) => {
  await login(page);
  await page.goto("/content/stories/story-first-spark");
  await page.locator("#story-cover-file").setInputFiles({ name: "regression-cover.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64") });
  await expect(page.locator(".asset-picker-selected")).toContainText("regression-cover.png");
  await expect(page.locator(".story-editor-save-status")).toContainText("Chưa lưu thay đổi");
  const saveButton = page.getByRole("button", { name: "Lưu thông tin truyện", exact: true });
  await saveButton.click();
  await expect(page.locator(".story-editor-save-status")).toContainText("Bản nháp đã lưu");
  await expect(page.locator("#story-title")).toHaveValue("Hạt mầm đầu tiên");
  await page.reload();
  await expect(page.locator(".asset-picker-selected")).toContainText("regression-cover.png");
  await page.locator("#story-title").fill("Unsaved metadata title");
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Rời trang", exact: true }).click();
  await expect(page).toHaveURL(/\/content\/stories\/story-first-spark\/pages$/);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});
