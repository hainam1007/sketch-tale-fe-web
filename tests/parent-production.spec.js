import { test, expect } from "@playwright/test";

test.skip(({ baseURL }) => baseURL !== "http://127.0.0.1:4178", "Requires the production preview config and npm run build.");

test("production parent session shows available features without demo requests", async ({ page }) => {
  const requests = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("sketchtale.access-token.v1", "test-token"));
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    if (path === "/api/auth/profile") {
      return route.fulfill({ json: { id: "parent-test", name: "Mai", role: "Parent", email: "mai@example.com" } });
    }
    if (path === "/api/subscription-plans") return route.fulfill({ json: [] });
    return route.fulfill({ status: 501, json: { message: "Unexpected API request" } });
  });
  await page.goto("/parent");
  await expect(page.getByRole("heading", { name: "Chào Mai, mừng bạn đến với SketchTale" })).toBeVisible();
  await expect(page.getByText("Không thể tải hồ sơ bé")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Thử lại" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Chào Mai, mừng bạn đến với SketchTale" })).toBeVisible();
  for (const path of ["/parent/children", "/parent/children/new", "/parent/children/example/dashboard", "/parent/library"]) {
    await page.goto(path);
    await expect(page.getByText("Tính năng đồng hành cùng bé đang được hoàn thiện")).toBeVisible();
  }
  await page.getByRole("link", { name: "Xem các gói sử dụng" }).click();
  await expect(page).toHaveURL(/\/parent\/plan$/);
  await expect.poll(() => requests.includes("/api/subscription-plans")).toBe(true);
  expect(requests.every((path) => ["/api/auth/profile", "/api/subscription-plans"].includes(path))).toBe(true);
  expect(errors).toEqual([]);
});
