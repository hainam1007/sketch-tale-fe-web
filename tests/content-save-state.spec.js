import { test, expect } from "@playwright/test";

test("Story metadata blocks leaving the editor while the form is dirty", async ({ page }) => {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);

  await page.goto("/content/stories/story-first-spark");
  await page.locator("#story-title").fill("Unsaved story title");
  await expect(page.getByText("Có thay đổi chưa lưu", { exact: true })).toBeVisible();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("thay đổi chưa lưu");
    await dialog.dismiss();
  });
  await page.getByRole("link", { name: "Pages" }).click();
  await expect(page).toHaveURL(/\/content\/stories\/story-first-spark$/);
});
