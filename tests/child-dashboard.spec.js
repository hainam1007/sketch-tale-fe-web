import { test, expect } from "@playwright/test";

async function login(page, email, password) {
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/parent$/);
}

test("Parent opens an isolated dashboard for each linked child", async ({ page }) => {
  await login(page, "parent.pro@example.com", "parent123");
  await page.goto("/parent");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/chọn một hành trình/i);
  await page.locator('a[href="/parent/children/child-minh-01/dashboard"]').click();
  await expect(page).toHaveURL(/\/parent\/children\/child-minh-01\/dashboard$/);
  await expect(page.locator(".child-dashboard-page")).toHaveAttribute("data-child-id", "child-minh-01");
  await expect(page.locator(".child-dashboard-stat-grid")).toContainText("78");
  await expect(page.getByRole("heading", { name: /Tổng quan của/ })).toContainText("Mây");

  await page.locator('select[aria-label="Đang xem hồ sơ bé"]').selectOption("child-minh-02");
  await expect(page).toHaveURL(/\/parent\/children\/child-minh-02\/dashboard$/);
  await expect(page.locator(".child-dashboard-page")).toHaveAttribute("data-child-id", "child-minh-02");
  await expect(page.getByRole("heading", { name: /Tổng quan của/ })).toContainText("Nắng");
  await expect(page.locator(".child-dashboard-stat-grid")).toContainText("Chưa có");
  await expect(page.locator(".child-dashboard-page")).not.toContainText("Mầm xanh");

  await page.locator('a[href="/parent/children/child-minh-02/exports"]').click();
  await expect(page).toHaveURL(/\/parent\/children\/child-minh-02\/exports$/);
  await expect(page.locator("#export-child")).toHaveCount(0);
  await expect(page.locator(".export-job-card")).toHaveCount(1);
});
