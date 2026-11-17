import { test, expect } from "@playwright/test";

test.use({ channel: "chromium" });

for (const status of [200, 500, 401]) {
  test(`logout clears the UI before a delayed ${status} response and preserves a newer login`, async ({ page }) => {
    let release;
    const held = new Promise(resolve => { release = resolve; });
    let logoutRequest;
    let refreshes = 0;
    await page.route(url => url.pathname.startsWith("/api/"), async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/auth/logout") {
        logoutRequest = route.request();
        await held;
        return route.fulfill({ status, json: { message: "Logout response" } });
      }
      if (path === "/api/auth/refresh-token") refreshes++;
      if (path === "/api/auth/profile") return route.fulfill({ json: { id: "parent-a", role: "Parent", name: "Parent A" } });
      return route.fulfill({ json: [] });
    });
    await page.goto("/");
    await page.evaluate(async () => {
      const { setTokenPair } = await import("/src/lib/api/authTokenStorage.js");
      setTokenPair({ accessToken: "old-access", refreshToken: "old-refresh" });
    });
    await page.goto("/parent");
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    try {
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("link", { name: /Vào không gian/i })).toHaveCount(0);
      await expect.poll(() => Boolean(logoutRequest)).toBe(true);
      expect(logoutRequest.headers().authorization).toBe("Bearer old-access");
      expect(await page.evaluate(() => [localStorage, sessionStorage].map(storage => [
        storage.getItem("sketchtale.access-token.v1"),
        storage.getItem("sketchtale.refresh-token.v1"),
        storage.getItem("sketchtale.session.v1"),
      ]))).toEqual([[null, null, null], [null, null, null]]);
      await page.evaluate(() => {
        history.pushState(null, "", "/parent");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      await expect(page).toHaveURL(/\/auth\/login/);
      await page.evaluate(async () => {
        const { setTokenPair } = await import("/src/lib/api/authTokenStorage.js");
        setTokenPair({ accessToken: "new-access", refreshToken: "new-refresh" });
      });
    } finally {
      const response = page.waitForResponse("**/api/auth/logout");
      release();
      await (await response).finished();
    }
    await expect.poll(() => refreshes).toBe(0);
    expect(await page.evaluate(() => localStorage.getItem("sketchtale.access-token.v1"))).toBe("new-access");
  });
}
