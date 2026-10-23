import { test, expect } from "@playwright/test";

test.use({ channel: "chromium" });

async function session(page, { empty = false, fail = false } = {}) {
  let child = {
    id: "11111111-1111-1111-1111-111111111111",
    nickName: "Mây",
    targetAgeGroup: "6–8 tuổi",
    dailyTimeLimit: 30,
    dailyCharacterLimit: 3,
  };
  const writes = [];
  await page.addInitScript(() =>
    localStorage.setItem("sketchtale.access-token.v1", "test-token"),
  );
  await page.route(url => url.pathname.startsWith("/api/"), async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/profile")
      return route.fulfill({
        json: {
          id: "parent-test",
          name: "Mai",
          role: "Parent",
          email: "mai@example.com",
        },
      });
    if (path === "/api/child-profiles")
      return route.fulfill({ json: empty ? [] : [child] });
    if (path === `/api/child-profiles/${child.id}`) {
      if (route.request().method() === "PUT") {
        writes.push(route.request().postDataJSON());
        if (fail)
          return route.fulfill({
            status: 500,
            json: { message: "Không lưu được, vui lòng thử lại." },
          });
        child = { ...child, ...writes.at(-1) };
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: child });
    }
    return route.fulfill({
      status: 501,
      json: { message: "Unexpected request" },
    });
  });
  return writes;
}

for (const width of [390, 768, 1366]) {
  test(`live parent profile at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const writes = await session(page);
    await page.goto("/parent");
    await page.getByRole("link", { name: /Mây.*6–8 tuổi/ }).click();
    await page.getByRole("link", { name: "Hồ sơ", exact: true }).click();
    await page.getByLabel("Tên hiển thị của bé").fill("Mây Nhỏ");
    await page.getByLabel("Thời gian sử dụng mỗi ngày (phút)").fill("45");
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Đã lưu hồ sơ" }),
    ).toBeVisible();
    expect(writes).toEqual([
      { nickName: "Mây Nhỏ", dailyTimeLimit: 45, dailyCharacterLimit: 3 },
    ]);
    await expect(
      page.getByRole("button", { name: "Lưu thay đổi" }),
    ).toBeDisabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/parent-profile-live-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("link", { name: "Báo cáo", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Cùng nhìn lại hành trình đọc", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Những điều bé đã học"),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("empty profiles provide account creation", async ({ page }) => {
  await session(page, { empty: true });
  await page.goto("/parent/children");
  await expect(
    page.getByRole("link", { name: /Thêm một bạn nhỏ/ }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /Thêm một bạn nhỏ/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tạo tài khoản cho bé" }),
  ).toBeVisible();
});

test("failed save preserves input and never reports success", async ({
  page,
}) => {
  await session(page, { fail: true });
  await page.goto("/parent/children/11111111-1111-1111-1111-111111111111/profile");
  await page.getByLabel("Tên hiển thị của bé").fill("Tên mới");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Không lưu được" }),
  ).toBeVisible();
  await expect(page.getByLabel("Tên hiển thị của bé")).toHaveValue("Tên mới");
  await expect(
    page.getByText("Đã lưu hồ sơ và giới hạn sử dụng của bé."),
  ).toHaveCount(0);
});

test("malformed profile response shows retry instead of an empty family", async ({ page }) => {
  await session(page);
  await page.route(url => url.pathname === "/api/child-profiles", route => route.fulfill({ json: { unexpected: true } }));
  await page.goto("/parent/children");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
  await expect(page.getByText("Bắt đầu với hồ sơ đầu tiên")).toHaveCount(0);
});
