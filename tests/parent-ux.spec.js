import { test, expect } from "@playwright/test";

async function login(page, email, password) {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/parent$/);
}

test("library search keeps the toolbar and focus while results reload", async ({ page }) => {
  await login(page, "parent.pro@example.com", "parent123");
  await page.goto("/parent/children/child-minh-01/library");

  const search = page.getByLabel("Tìm trong thư viện");
  await expect(search).toBeVisible();
  await search.fill("M");
  await expect(search).toBeFocused();
  await expect(page.locator(".library-toolbar")).toBeVisible();
  await expect(page).toHaveURL(/q=M/);

  await search.fill("không-có-kết-quả");
  await expect(search).toBeFocused();
  await expect(page.getByText("Không tìm thấy nội dung")).toBeVisible();
  await expect(page.getByRole("button", { name: "Xóa bộ lọc" })).toBeVisible();
});

test("export creation stays unavailable until a child and story are selected", async ({ page }) => {
  await login(page, "parent.pro@example.com", "parent123");
  await page.goto("/parent/exports");
  const create = page.getByRole("button", { name: "Tạo bản xuất" });
  await expect(create).toBeDisabled();
  await page.locator("#export-child").selectOption("child-minh-01");
  await expect(create).toBeDisabled();
  await page.locator("#export-story").selectOption("story-first-spark");
  await expect(create).toBeEnabled();
});

test("mobile workspace navigation traps focus and returns it after Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "parent.pro@example.com", "parent123");
  const menu = page.getByRole("button", { name: "Mở điều hướng" });
  await menu.click();
  await expect(page.getByRole("button", { name: "Đóng điều hướng" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(page.getByRole("button", { name: "Đóng điều hướng" })).toBeHidden();
});
