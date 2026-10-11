import { test, expect } from "@playwright/test";

test("confirms email from the backend callback URL", async ({ page }) => {
  let confirmationUrl;
  await page.route("**/api/auth/confirm-email?**", async (route) => {
    confirmationUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Email confirmed" }),
    });
  });

  await page.goto("/confirm-email?email=parent%40example.com&token=local-test-token");
  await expect(page.getByRole("heading", { name: "Xác nhận email của bạn" })).toBeVisible();
  await expect(page).not.toHaveURL(/token=/);
  await expect(page.getByText("parent@example.com")).toBeVisible();

  await page.getByRole("button", { name: "Xác nhận email" }).click();

  await expect(page.getByRole("heading", { name: "Email đã được xác thực" })).toBeVisible();
  await expect(page.locator(".auth-card").getByRole("link", { name: "Đăng nhập" })).toBeVisible();
  expect(confirmationUrl).toBeTruthy();
  const query = new URL(confirmationUrl).searchParams;
  expect(query.get("email")).toBe("parent@example.com");
  expect(query.get("token")).toBe("local-test-token");
});

test("shows a recoverable message when callback parameters are missing", async ({ page }) => {
  await page.goto("/confirm-email");
  await expect(page.getByRole("heading", { name: "Liên kết không hợp lệ" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tạo tài khoản" })).toBeVisible();
});
