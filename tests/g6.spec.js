import { test, expect } from "@playwright/test";

async function login(page, email, password, home) {
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(new RegExp(`/${home}$`));
}

test("Parent can inspect progress by range and keep dashboard usable on partial error", async ({ page }) => {
  await login(page, "parent.pro@example.com", "parent123", "parent");
  await page.goto("/parent/children/child-minh-01/progress?range=7d");

  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Những bước nhỏ đang thành câu chuyện");
  await expect(page.locator("#progress-range")).toHaveValue("7d");
  await expect(page.locator(".progress-stat-grid .workspace-stat-card")).toHaveCount(4);
  await expect(page.locator(".progress-stat-grid")).toContainText("78");
  await page.locator("#progress-range").selectOption("30d");
  await expect(page.locator("#progress-range")).toHaveValue("30d");
  await expect(page.locator(".progress-stat-grid")).toContainText("246");

  await page.goto("/parent/children/child-minh-02/progress?range=7d");
  await expect(page.getByText("Chưa có dữ liệu học tập")).toBeVisible();

  await page.goto("/parent?range=7d&simulate=recent-error");
  await expect(page.getByRole("heading", { name: "Nhịp đọc của gia đình" })).toBeVisible();
  await expect(page.locator(".parent-dashboard-stat-grid")).toBeVisible();
  await expect(page.locator(".dashboard-partial-warning")).toContainText("Hoạt động gần đây tạm thời chưa tải được");
});

test("Content Manager can inspect content statistics by date range", async ({ page }) => {
  await login(page, "content@example.com", "content123", "content");
  await page.goto("/content/statistics?range=7d");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hiệu quả nội dung");
  await expect(page.locator(".workspace-stat-grid .workspace-stat-card")).toHaveCount(4);
  await expect(page.locator(".workspace-stat-grid")).toContainText("42");
  await page.locator("#content-statistics-range").selectOption("30d");
  await expect(page.locator("#content-statistics-range")).toHaveValue("30d");
  await expect(page.locator(".workspace-stat-grid")).toContainText("126");
  await expect(page.locator(".analytics-story-item")).toContainText("Hạt mầm đầu tiên");
});

test("Admin can inspect aggregate statistics and filter the read-only audit viewer", async ({ page }) => {
  await login(page, "admin@example.com", "admin123", "admin");
  await page.goto("/admin/statistics?range=7d");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Số liệu vận hành");
  await expect(page.locator(".workspace-stat-grid .workspace-stat-card")).toHaveCount(4);
  await expect(page.locator(".workspace-stat-grid")).toContainText("324");
  await page.locator("#admin-statistics-range").selectOption("30d");
  await expect(page.locator(".workspace-stat-grid")).toContainText("1086");

  await page.goto("/admin/audit");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lịch sử thao tác");
  await expect(page.locator(".audit-table tbody tr")).toHaveCount(4);
  await page.getByLabel("Lọc actor").selectOption("admin@example.com");
  await expect(page.locator(".audit-table tbody tr")).toHaveCount(3);
  await page.getByLabel("Lọc action").selectOption("permission.updated");
  await expect(page.locator(".audit-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".audit-table")).toContainText("An Phạm");
});
