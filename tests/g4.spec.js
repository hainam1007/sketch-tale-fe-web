import { test, expect } from "@playwright/test";

async function login(page, email, password, home) {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(new RegExp(`/${home}$`));
}

test("Parent can save child settings, approve a version and manage library safely", async ({ page }) => {
  await login(page, "parent.pro@example.com", "parent123", "parent");
  await page.goto("/parent/children/child-minh-01/settings");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Đặt nhịp đọc vừa đủ cho bé");
  await page.locator("#reading-time").selectOption("45");
  await page.getByLabel("Cảm xúc").check();
  await page.getByRole("button", { name: "Lưu cài đặt" }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu cài đặt");
  await expect(page.locator("#reading-time")).toHaveValue("45");

  await page.goto("/parent/children/child-minh-01/approvals");
  await expect(page.locator(".approval-list-item")).toHaveCount(2);
  await page.getByRole("button", { name: "Phê duyệt phiên bản" }).click();
  await page.getByRole("button", { name: "Đã duyệt" }).click();
  await expect(page.locator(".approval-list-item")).toContainText("Mầm xanh");
  await expect(page.getByRole("status")).toContainText("đã được duyệt");

  await page.goto("/parent/children/child-minh-01/library");
  await expect(page.locator(".library-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Ẩn Hạt mầm đầu tiên" }).click();
  await expect(page.locator(".library-card.is-hidden")).toHaveCount(1);
  await page.getByRole("button", { name: "Hiện lại Hạt mầm đầu tiên" }).click();
  await expect(page.locator(".library-card.is-hidden")).toHaveCount(0);
});

test("Admin can move a content report through moderation workflow", async ({ page }) => {
  await login(page, "admin@example.com", "admin123", "admin");
  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hàng đợi báo cáo nội dung");
  await page.getByRole("link", { name: /Hạt mầm đầu tiên/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hạt mầm đầu tiên");
  await page.getByLabel("Ghi chú").fill("Đã kiểm tra target và chuyển Content Manager xử lý.");
  await page.getByRole("button", { name: "Nhận xử lý" }).click();
  await expect(page.locator(".workspace-badge-gold")).toHaveText("Đang xem xét");
  await page.getByRole("button", { name: "Đánh dấu đã giải quyết" }).click();
  await expect(page.locator(".workspace-badge-success")).toHaveText("Đã giải quyết");
  await expect(page.getByRole("status")).toContainText("đã cập nhật report");
});
