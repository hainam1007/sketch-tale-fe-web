import { test, expect } from "@playwright/test";

const actor = "11111111-1111-1111-1111-111111111111";
const audits = Array.from({ length: 12 }, (_, i) => ({ id: `audit-${i}`, createBy: actor, auditAction: "Update", entityName: "StoryTemplate", primaryKey: actor, createdAt: new Date(Date.now() - i * 60000).toISOString(), oldValues: '{"name":"Old"}', newValues: '{"name":"Updated"}' }));
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sketchtale.access-token.v1", "test-admin-token");
    localStorage.setItem("sketchtale.refresh-token.v1", "test-refresh");
  });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    let data;
    if (path === "/api/auth/profile") data = { id: actor, role: "Admin", name: "Admin QA", email: "admin@example.com" };
    else if (path.startsWith("/api/audit-logs")) data = path.includes("/audit-") && /audit-\d+$/.test(path) ? audits.find((item) => path.endsWith(item.id)) : audits;
    else if (path === "/api/content-reports") data = Array.from({ length: 12 }, (_, i) => ({ id: `report-${i}`, targetId: actor, reason: `Report reason ${i}`, status: i % 4, targetType: 0, createBy: actor, createdAt: audits[0].createdAt }));
    else if (path === "/api/subscription-plans") data = [{ id: "plan-1", name: "Old plan", code: "PLAN", price: 10, monthlyCreditLimit: 10, childProfileLimit: 1, isActive: true }];
    else if (path === "/api/subscription-plans/plan-1") data = { id: "plan-1", name: "Latest plan", code: "PLAN", price: 10, monthlyCreditLimit: 10, childProfileLimit: 1, isActive: true };
    else if (path === "/api/char-types") data = [{ id: "type-1", name: "Animal", description: "A friendly animal", status: 2 }];
    else return route.fulfill({ status: 404, json: { message: `Unexpected test request ${path}` } });
    return route.fulfill({ json: data });
  });
});

test("audit clamps pages, calls scoped API and restores keyboard focus", async ({ page }) => {
  await page.goto("/admin/audit?page=999&range=all");
  await expect(page.getByText("Trang 2 / 2", { exact: true })).toBeVisible();
  const view = page.getByRole("button", { name: "Xem", exact: true }).first();
  await view.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("dialog pre")).toContainText('"Updated"');
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(view).toBeFocused();
  await page.getByLabel("Phạm vi tra cứu").selectOption("user");
  await page.getByLabel("Giá trị tra cứu").fill(actor);
  const requested = page.waitForRequest(`**/api/audit-logs/user-id/${actor}`);
  await page.getByRole("button", { name: "Tra cứu", exact: true }).click();
  await requested;
  await expect(page.getByText("Trang 1 / 2", { exact: true })).toBeVisible();
  await page.getByLabel("Tìm audit").fill("no-match");
  await expect(page.getByText("Không có thao tác phù hợp")).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(10);
});

test("reports use real adapter, filter and paginate", async ({ page }) => {
  await page.goto("/admin/reports?page=999");
  await expect(page.getByText("Trang 2 / 2 · 12 báo cáo")).toBeVisible();
  await page.getByLabel("Trạng thái báo cáo").selectOption("2");
  await expect(page.locator(".admin-report-item")).toHaveCount(3);
  await expect(page.locator(".admin-demo-banner")).toHaveCount(0);
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(page.locator(".admin-report-item")).toHaveCount(10);
});

test("catalog reads detail before editing", async ({ page }) => {
  await page.goto("/admin/subscription-plans");
  await page.getByRole("button", { name: "Chỉnh sửa" }).click();
  await expect(page.getByLabel("Tên gói", { exact: false })).toHaveValue("Latest plan");
});

test("admin list pages fit desktop and mobile", async ({ page }) => {
  test.setTimeout(90_000);
  for (const path of ["audit", "reports", "char-types", "subscription-plans", "users", "permissions", "system-limits", "monitoring", "statistics"]) {
    await page.goto(`/admin/${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const width of [1366, 768, 390]) {
      await page.setViewportSize({ width, height: 850 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect.poll(() => page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, overflowing: [...document.querySelectorAll("main *")].filter((node) => node.getBoundingClientRect().right > innerWidth && getComputedStyle(node).position !== "absolute").slice(0, 8).map((node) => node.className || node.tagName) })), { message: `${path} at ${width}px` }).toMatchObject({ width, document: width });
      if (["audit", "reports"].includes(path)) await page.screenshot({ path: `artifacts/admin-${path}-${width}.png`, fullPage: true });
    }
  }
});
