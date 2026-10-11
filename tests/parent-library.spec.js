import { test, expect } from "@playwright/test";

async function login(page, email = "parent.pro@example.com") {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill("parent123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/parent$/);
  await page.goto("/parent/reports");
  await expect(page).toHaveURL(/\/parent\/library$/);
}

test("parent can search, preview and recommend to one child without duplicates", async ({ page }) => {
  await login(page);
  await page.getByLabel("Tìm truyện", { exact: true }).fill("khong tim thay");
  await expect(page.getByText("Không tìm thấy truyện phù hợp")).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await page.getByRole("button", { name: "Xem trước Hạt mầm đầu tiên" }).click();
  await expect(page.getByRole("heading", { name: "Bắt đầu từ một hạt mầm" })).toBeVisible();
  await page.getByRole("button", { name: "Trang tiếp theo" }).click();
  await expect(page.getByRole("heading", { name: "Khu vườn thức giấc" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đề xuất cho bé", exact: true })).toBeDisabled();
  await page.getByRole("radio", { name: "Nắng" }).check();
  await page.getByRole("button", { name: "Đề xuất cho bé", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã thêm vào thư viện của Nắng");
  await page.reload();
  await page.getByRole("radio", { name: "Nắng" }).check();
  await page.getByRole("button", { name: "Đề xuất cho bé", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã thêm vào thư viện của Nắng");
  const libraries = await page.evaluate(() => JSON.parse(sessionStorage.getItem("sketchtale.mock.database.v1")).library);
  expect(libraries["child-minh-02"].filter((item) => item.sourceId === "story-first-spark")).toHaveLength(1);
  expect(libraries["child-minh-01"].some((item) => item.recommendedByParent)).toBe(false);
  await page.getByRole("link", { name: "Xem thư viện của bé" }).click();
  await expect(page.getByRole("heading", { name: "Hạt mầm đầu tiên" })).toBeVisible();
});

test("mobile catalog and preview support parents without child profiles", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "parent@example.com");
  await expect(page.getByRole("button", { name: "Xem trước Hạt mầm đầu tiên" })).toBeVisible();
  await page.screenshot({ path: "artifacts/parent-library-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Xem trước Hạt mầm đầu tiên" }).click();
  await expect(page.getByRole("link", { name: "Thêm hồ sơ bé", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("desktop library layout", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("button", { name: "Xem trước Hạt mầm đầu tiên" })).toBeVisible();
  await page.screenshot({ path: "artifacts/parent-library-desktop.png", fullPage: true });
});
