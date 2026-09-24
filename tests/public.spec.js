import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home and responsive layouts have no overflow, visible CTA and usable images", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Mỗi nét vẽ",
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "một câu chuyện.",
  );
  await expect(page.locator(".landing-section")).toHaveCount(8);
  await expect(page.locator(".landing-story-grid .story-card")).toHaveCount(3);
  for (const width of [360, 390, 768, 1024, 1366, 1440]) {
    await page.setViewportSize({ width, height: 768 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const cta = await page
      .locator(".landing-hero .landing-button-primary")
      .boundingBox();
    expect(cta.y + cta.height).toBeLessThan(768);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: "artifacts/home-desktop.png", fullPage: true });
  await page.screenshot({ path: "artifacts/hero-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/home-mobile.png", fullPage: true });
  await page.screenshot({ path: "artifacts/hero-mobile.png" });
  expect(
    await page
      .locator("img")
      .evaluateAll((images) =>
        images.every((img) => img.complete && img.naturalWidth > 0),
      ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("contact validation and auth explicitly remain demo with no persistence", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Kiểm tra biểu mẫu" }).click();
  await expect(
    page.getByText("Vui lòng nhập tên người liên hệ."),
  ).toBeVisible();
  await page.getByLabel("Tên người liên hệ").fill("Người thử");
  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Nội dung").fill("Tôi muốn tìm hiểu truyện mẫu.");
  await page.getByRole("button", { name: "Kiểm tra biểu mẫu" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Bản demo chưa gửi liên hệ.",
  );
  await page.goto("/auth/register");
  await page.getByLabel("Email", { exact: true }).fill("demo@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("only-a-demo");
  await page.getByLabel("Nhập lại mật khẩu").fill("only-a-demo");
  await page.getByRole("button", { name: "Kiểm tra đăng ký" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Bản demo chưa đăng nhập hoặc tạo tài khoản.",
  );
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveValue("");
});

test("mobile menu keyboard, anchor and route recovery", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(page.locator("#mobile-menu a").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Mở menu" })).toBeFocused();
  await page.getByRole("button", { name: "Mở menu" }).click();
  await page.locator("#mobile-menu").getByText("Tính năng").click();
  await expect(page.locator("#mobile-menu")).toBeHidden();
  await expect(page).toHaveURL(/#features/);
  await page.goto("/stories");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Trang này đi lạc rồi.",
  );
  await page.goto("/for-parents");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Trang này đi lạc rồi.",
  );
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Trang này đi lạc rồi.",
  );
  await page.goto("/not-a-page");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Trang này đi lạc rồi.",
  );
});

test("all public destinations render one h1 and pass automated accessibility checks", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const route of [
    "/",
    "/faq",
    "/contact",
    "/about",
    "/privacy",
    "/terms",
    "/child-safety",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(".loading-state")).toHaveCount(0);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
      route,
    ).toEqual([]);
  }
});
