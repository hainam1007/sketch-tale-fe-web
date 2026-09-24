import { test, expect } from "@playwright/test";

test("Content Manager can create a story draft with a cover asset", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill("content@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("content123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/content$/);

  await page.getByRole("link", { name: "Truyện", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kho truyện");
  await page.getByRole("link", { name: "Tạo story" }).click();
  await page.getByLabel("Tên truyện").fill("Một ngày trong khu vườn");
  await page.getByLabel("Mô tả ngắn").fill("Một bản nháp về những điều bé tìm thấy trong vườn.");
  await page.getByLabel("Category").selectOption({ label: "Thiên nhiên" });
  await page.getByLabel("Asset cover").selectOption("asset-seed-character");
  await page.getByRole("button", { name: "Lưu bản nháp" }).click();

  await expect(page).toHaveURL(/\/content\/stories\/story-/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Một ngày trong khu vườn");
  await expect(page.getByLabel("Asset cover")).toHaveValue("asset-seed-character");
});

test("Admin can lock and unlock another account with server confirmation", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "Tài khoản", exact: true }).click();
  await page.getByRole("link", { name: /An Phạm/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chi tiết tài khoản");

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Khóa tài khoản" }).click();
  await expect(page.locator(".workspace-badge-danger")).toHaveText("Đang khóa");
  await page.getByRole("button", { name: "Mở khóa tài khoản" }).click();
  await expect(page.locator(".workspace-badge-success")).toHaveText("Đang hoạt động");
});
