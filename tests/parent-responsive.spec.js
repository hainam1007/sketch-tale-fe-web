import { test, expect } from "@playwright/test";

const widths = [1440, 1280, 1024, 820, 800, 768, 390, 375, 360];
const childRoutes = [
  "/parent/children/child-minh-01/dashboard",
  "/parent/children/child-minh-01",
  "/parent/children/child-minh-01/settings",
  "/parent/children/child-minh-01/approvals",
  "/parent/children/child-minh-01/library",
  "/parent/children/child-minh-01/progress",
  "/parent/children/child-minh-01/exports",
];

async function login(page) {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("parent.pro@example.com");
  await page.locator("#auth-password").fill("parent123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/parent$/);
}

async function assertNoPageOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(metrics.documentWidth, `document overflow at ${metrics.viewport}px`).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.bodyWidth, `body overflow at ${metrics.viewport}px`).toBeLessThanOrEqual(metrics.viewport + 1);
}

test("Parent screens fit every planned viewport and preserve mobile navigation", async ({ page }) => {
  test.setTimeout(360000);
  await login(page);

  for (const width of widths) {
    await page.setViewportSize({ width, height: width <= 800 ? 844 : 900 });
    for (const route of childRoutes) {
      await page.goto(route);
      await expect(page.locator(".child-workspace")).toBeVisible();
      if (route.endsWith("/dashboard")) await expect(page.locator(".child-dashboard-stat-grid")).toBeVisible();
      await assertNoPageOverflow(page);
      await expect(page.locator(".child-tabs a").last()).toBeVisible();
      if (width <= 800 && route.endsWith("/exports")) {
        const activeTab = page.locator(".child-tabs a.active");
        const tabViewport = page.locator(".child-tabs");
        const activeBox = await activeTab.boundingBox();
        const viewportBox = await tabViewport.boundingBox();
        expect(activeBox?.x).toBeGreaterThanOrEqual((viewportBox?.x || 0) - 1);
        expect((activeBox?.x || 0) + (activeBox?.width || 0)).toBeLessThanOrEqual((viewportBox?.x || 0) + (viewportBox?.width || 0) + 1);
      }
    }

    if (width <= 800) {
      const menu = page.getByRole("button", { name: "Mở điều hướng" });
      await menu.click();
      await expect(page.getByRole("button", { name: "Đóng điều hướng" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(menu).toBeFocused();
    }
  }
});

test("Parent representative screens render review screenshots at desktop and mobile", async ({ page }) => {
  test.setTimeout(180000);
  await login(page);
  for (const [width, suffix] of [[1440, "desktop"], [390, "mobile"]]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const [name, route] of [["dashboard", "dashboard"], ["profile", ""], ["settings", "settings"], ["approvals", "approvals"], ["library", "library"], ["progress", "progress"], ["exports", "exports"]]) {
      await page.goto(`/parent/children/child-minh-01/${route}`);
      await expect(page.locator(".child-workspace")).toBeVisible();
      if (route === "dashboard") await expect(page.locator(".child-dashboard-stat-grid")).toBeVisible();
      await assertNoPageOverflow(page);
      await page.screenshot({ path: `test-results/parent-responsive-${suffix}-${name}.png`, fullPage: true });
    }
  }
});
