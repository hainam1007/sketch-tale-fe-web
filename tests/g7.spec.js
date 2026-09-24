import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function login(page, email, password, home) {
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(new RegExp(`/${home}$`));
}

test("Pro parent can create, retry and download export jobs", async ({ page }) => {
  await login(page, "parent.pro@example.com", "parent123", "parent");
  await page.goto("/parent/exports");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Giữ lại những trang đã cùng nhau đọc.");
  await expect(page.locator(".export-quota-card")).toContainText("4 / 5");
  await expect(page.locator(".export-job-card")).toHaveCount(4);
  const processingJob = page.locator('[data-export-id="export-pro-processing"]');
  await expect(processingJob.locator(".workspace-badge")).toHaveText("Đang chạy");
  await expect(processingJob.locator(".export-progress-label")).toContainText("68%");

  const failedJob = page.locator('[data-export-id="export-pro-failed"]');
  await failedJob.getByRole("button", { name: "Tạo lại export" }).click();
  await expect(failedJob.locator(".workspace-badge")).toHaveText("Đang chờ");

  const expiredJob = page.locator('[data-export-id="export-pro-expired"]');
  await expect(expiredJob.locator(".workspace-badge")).toHaveText("Đã hết hạn");
  await expiredJob.getByRole("button", { name: "Tạo lại export" }).click();
  await expect(expiredJob.locator(".workspace-badge")).toHaveText("Đang chờ");

  const completedJob = page.locator('[data-export-id="export-pro-completed"]');
  await completedJob.getByRole("button", { name: "Tải file" }).click();
  await expect(completedJob.locator('a[download]')).toBeVisible();

  await page.locator("#export-child").selectOption("child-minh-01");
  await page.locator("#export-story").selectOption("story-first-spark");
  await page.locator("#export-format").selectOption("video");
  await page.getByRole("button", { name: "Tạo export" }).click();
  await expect(page.getByRole("status")).toContainText("Export đã được tạo");
  await expect(page.locator(".export-job-card")).toHaveCount(5);
});

test("Family parent can configure report cadence without fake email delivery", async ({ page }) => {
  await login(page, "family@example.com", "family123", "parent");
  await page.goto("/parent/exports");

  const report = page.locator(".family-report-card");
  await expect(report.getByRole("heading", { name: "Báo cáo học tập Family" })).toBeVisible();
  await expect(report.locator(".workspace-badge")).toHaveText("Sẵn sàng");
  await expect(report).toContainText("backend");
  await expect(report.getByRole("button", { name: /gửi email/i })).toHaveCount(0);

  await report.locator("#report-schedule").selectOption("quarterly");
  await report.getByRole("button", { name: "Lưu cài đặt" }).click();
  await expect(report.getByRole("status")).toContainText("Đã lưu cài đặt báo cáo");
});

test("Pro parent sees Family report as unavailable when entitlement does not allow it", async ({ page }) => {
  await login(page, "parent.pro@example.com", "parent123", "parent");
  await page.goto("/parent/exports");

  const report = page.locator(".family-report-card");
  await expect(report.locator(".workspace-badge")).toHaveText("Chưa khả dụng");
  await expect(report).toContainText("chỉ dành cho gói Family");
});

test("Parent export workspace survives mobile deep-link refresh and accessibility scan", async ({ page }) => {
  await login(page, "parent.pro@example.com", "parent123", "parent");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/parent/exports");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".export-layout")).toBeVisible();
  await expect((await new AxeBuilder({ page }).include(".export-page").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.reload();
  await expect(page).toHaveURL(/\/parent\/exports$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
