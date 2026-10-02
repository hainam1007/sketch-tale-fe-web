import { test, expect } from "@playwright/test";

async function login(page) {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("parent.pro@example.com");
  await page.locator("#auth-password").fill("parent123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/parent$/);
}

test("Parent keeps sensitive-role permission separate from version approval", async ({ page }) => {
  await login(page);
  await page.goto("/parent/children/child-minh-01/approvals");
  await page.getByRole("button", { name: /Bạn đêm/ }).click();

  await expect(page.getByText("Quyền vai: Chưa cho phép")).toBeVisible();
  await page.getByRole("button", { name: "Phê duyệt phiên bản" }).click();
  await expect(page.locator(".approval-list-item").filter({ hasText: "Bạn đêm" })).toHaveCount(0);
  await page.goto("/parent/children/child-minh-01/approvals?status=approved&approvalId=approval-role-01");
  await expect(page.getByText("Phiên bản đã được duyệt.")).toBeVisible();
  await expect(page.getByText("Quyền vai: Chưa cho phép")).toBeVisible();

  await page.getByRole("button", { name: "Cho phép vai này" }).click();
  await expect(page.getByText("Quyền vai: Đã cho phép")).toBeVisible();
  await expect(page.getByRole("button", { name: "Thu hồi quyền vai" })).toBeVisible();
});
