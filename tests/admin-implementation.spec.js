import { test, expect } from "@playwright/test";

async function loginAdmin(page) {
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("Admin overview exposes operational queues and complete navigation", async ({ page }) => {
  await loginAdmin(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Phòng điều hành");
  await expect(page.getByRole("link", { name: "Phân quyền", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Giới hạn hệ thống", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Báo cáo nội dung/ }).first()).toBeVisible();
  await page.getByRole("link", { name: /Báo cáo chờ xử lý/ }).click();
  await expect(page).toHaveURL(/\/admin\/reports\?status=open/);
});

test("Admin users keeps page size in the URL and limits validate fields", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/admin/users");
  await page.getByLabel("Số dòng mỗi trang").selectOption("25");
  await expect(page).toHaveURL(/pageSize=25/);
  await page.goto("/admin/system-limits");
  const input = page.locator("#limit-maxAssetSizeMb");
  await input.fill("");
  await page.getByRole("button", { name: "Lưu giới hạn" }).click();
  await expect(page.locator("#maxAssetSizeMb-error")).toHaveText("Nhập số nguyên dương.");
});
