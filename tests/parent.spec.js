import { test, expect } from "@playwright/test";

test("parent can create, edit, refresh and logout from a child workspace", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill("parent@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("parent123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page).toHaveURL(/\/parent$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Chào Linh");
  await page.getByRole("link", { name: /Thêm hồ sơ bé/ }).first().click();
  await page.getByLabel("Tên hiển thị").fill("Mây");
  await page.getByLabel("Ngày sinh").fill("2021-05-14");
  await page.getByRole("button", { name: "Tạo hồ sơ bé" }).click();

  await expect(page).toHaveURL(/\/parent\/children\/child-/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mây");
  await page.getByLabel("Tên hiển thị").fill("Mây Nhỏ");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi hồ sơ.");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mây Nhỏ");

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/parent");
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("role guard keeps Parent routes away from Content Manager", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill("content@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("content123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/content$/);
  await page.goto("/parent");
  await expect(page).toHaveURL(/\/403$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("không dành cho phiên hiện tại");
});
