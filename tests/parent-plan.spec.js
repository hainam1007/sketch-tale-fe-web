import { test, expect } from "@playwright/test";

async function login(page, email, password) {
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/parent$/);
}

test("Free parent can compare plans and open the checkout placeholder", async ({ page }) => {
  await login(page, "parent@example.com", "parent123");
  await page.goto("/parent/plan");

  await expect(page.locator("#current-plan-title")).toHaveText("Free");
  await expect(page.locator(".plan-current-card")).toContainText("Không áp dụng với Free");
  await expect(page.getByRole("link", { name: "Đăng ký Pro" })).toHaveAttribute("href", "/parent/checkout?plan=pro");
  await expect(page.getByRole("link", { name: "Đăng ký Family" })).toHaveAttribute("href", "/parent/checkout?plan=family");

  await page.getByRole("link", { name: "Đăng ký Pro" }).click();
  await expect(page).toHaveURL(/\/parent\/checkout\?plan=pro$/);
  await expect(page.getByRole("heading", { name: "Chuẩn bị thanh toán" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Thanh toán sẽ mở/ })).toBeDisabled();
});

test("Plan page stays within a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "parent@example.com", "parent123");
  await page.goto("/parent/plan");
  await expect(page.locator(".plan-option-grid")).toBeVisible();
  const width = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(width.document).toBeLessThanOrEqual(width.viewport + 1);
});
