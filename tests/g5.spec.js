import { test, expect } from "@playwright/test";

async function login(page, email, password, home) {
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(new RegExp(`/${home}$`));
}

test("Pro parent can inspect server entitlement and usage", async ({ page }) => {
  await login(page, "parent.pro@example.com", "parent123", "parent");
  await page.goto("/parent/plan");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gói đang đồng hành cùng gia đình");
  await expect(page.locator(".plan-summary-primary")).toContainText("Pro");
  await expect(page.locator(".plan-stat-value")).toContainText("2");
  await expect(page.locator(".plan-stat-value")).toContainText("3");
  await expect(page.locator(".plan-entitlement-card")).toContainText("server xác nhận");
});

test("Admin can update permissions, limits, restrictions and monitoring states", async ({ page }) => {
  await login(page, "admin@example.com", "admin123", "admin");

  await page.goto("/admin/permissions");
  const accountRow = page.getByRole("row").filter({ hasText: "An Phạm" });
  await accountRow.getByRole("combobox", { name: "Role mới của An Phạm" }).selectOption("parent");
  await accountRow.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByRole("status")).toContainText("Server đã cập nhật role");

  await page.goto("/admin/system-limits");
  await page.locator("#limit-maxStoryPages").fill("18");
  await page.getByRole("button", { name: "Lưu giới hạn" }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu giới hạn hệ thống");
  await expect(page.locator("#limit-maxStoryPages")).toHaveValue("18");

  await page.goto("/admin/restrictions");
  const restriction = page.locator(".restriction-card").first();
  await expect(restriction.locator(".workspace-badge")).toHaveText("Đang hoạt động");
  await restriction.getByRole("button").click();
  await expect(restriction.locator(".workspace-badge")).toHaveText("Đã tắt");

  await page.goto("/admin/monitoring");
  const processingJob = page.locator(".monitoring-card").filter({ hasText: "story-first-spark / page-2" });
  await processingJob.getByRole("button", { name: "Cancel" }).click();
  await expect(processingJob.locator(".workspace-badge")).toHaveText("Đã hủy");
  const failedJob = page.locator(".monitoring-card").filter({ hasText: "asset-upload-previous" });
  await failedJob.getByRole("button", { name: "Retry" }).click();
  await expect(failedJob.locator(".workspace-badge")).toHaveText("Đang chạy");
});

test("Content Manager can preview, upload and filter an image asset", async ({ page }) => {
  await login(page, "content@example.com", "content123", "content");
  await page.goto("/content/assets");

  await expect(page.locator(".asset-card")).toHaveCount(2);
  await page.getByPlaceholder("Tìm tên file").fill("nhan-vat");
  await expect(page.locator(".asset-card")).toHaveCount(1);
  await page.getByPlaceholder("Tìm tên file").fill("");

  await page.locator("#asset-file").setInputFiles({
    name: "g5-preview.png",
    mimeType: "image/png",
    buffer: Buffer.from("g5-test-image"),
  });
  await expect(page.locator(".asset-upload-preview")).toBeVisible();
  await page.getByRole("button", { name: "Thêm vào library" }).click();
  await expect(page.getByRole("status")).toContainText("Asset đã được thêm vào library");
  await expect(page.locator(".asset-card")).toHaveCount(3);
});
