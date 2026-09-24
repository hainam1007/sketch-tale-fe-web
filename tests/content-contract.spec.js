import { test, expect } from "@playwright/test";

test("Content preview renders every role slot from the contract fixture", async ({ page }) => {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);

  await page.goto("/content/stories/story-contract-multi-role/preview");
  await expect(page.locator(".story-preview-stage")).toBeVisible();
  await expect(page.locator(".story-preview-slot")).toHaveCount(1);

  await page.getByRole("button", { name: /Two friends arrive/ }).click();
  await expect(page.locator(".story-preview-slot")).toHaveCount(2);
  await expect(page.locator('[data-role-id="role-contract-sprout"]')).toBeVisible();
  await expect(page.locator('[data-role-id="role-contract-moth"]')).toBeVisible();
});

