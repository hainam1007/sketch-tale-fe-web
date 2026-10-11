import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const roles = [
  { role: "parent", email: "parent@example.com", password: "parent123", home: "/parent", links: ["/parent/children", "/parent/library", "/parent/plan"] },
  { role: "content", email: "content@example.com", password: "content123", home: "/content", links: ["/content/stories", "/content/assets", "/content/statistics"] },
  { role: "admin", email: "admin@example.com", password: "admin123", home: "/admin", links: ["/admin/users", "/admin/reports", "/admin/monitoring"] },
];

for (const account of roles) {
  test(`${account.role} profile is accessible, responsive and links to its own workspace`, async ({ page }) => {
    await page.goto("/auth/login");
    await page.locator("#auth-email").fill(account.email);
    await page.locator("#auth-password").fill(account.password);
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL(new RegExp(`${account.home}$`));
    await page.goto("/profile");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hồ sơ của bạn");
    await expect(page.locator('.workspace-sidebar-bottom a[aria-current="page"]')).toHaveAttribute("href", "/profile");
    await expect(page.locator(".profile-home-link")).toHaveAttribute("href", account.home);
    await expect(page.locator(".profile-shortcut")).toHaveCount(account.links.length);
    for (const [index, href] of account.links.entries()) {
      await expect(page.locator(".profile-shortcut").nth(index)).toHaveAttribute("href", href);
    }
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator(".profile-identity")).toContainText(account.email);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (width === 1440 || width === 390) {
        expect((await new AxeBuilder({ page }).include(".workspace-profile-page").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
        await page.screenshot({ path: `artifacts/profile-${account.role}-${width}.png`, fullPage: true });
      }
    }
    await page.locator(".profile-shortcut").first().click();
    await expect(page).toHaveURL(new RegExp(`${account.links[0]}$`));
    await page.goto("/profile");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hồ sơ của bạn");
    await page.locator(".profile-home-link").click();
    await expect(page).toHaveURL(new RegExp(`${account.home}$`));
  });
}
