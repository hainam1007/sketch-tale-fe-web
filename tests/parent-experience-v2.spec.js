import { test, expect } from "@playwright/test";
test.use({ channel: "chromium" });
test.setTimeout(90_000);
const id = "11111111-1111-1111-1111-111111111111";
async function setup(page) {
  const writes = [];
  const child = {
    id,
    nickName: "Mây",
    targetAgeGroup: "Age8to10",
    dailyTimeLimit: 30,
    dailyCharacterLimit: 3,
  };
  const story = {
    id: "garden",
    title: "Khu vườn của Mây",
    description: "Một câu chuyện về những người bạn chăm sóc khu vườn.",
    educationThemeId: "nature",
    coverImageUrl: "/missing-cover.jpg",
    totalPageNumbers: 0,
  };
  await page.addInitScript(() =>
    localStorage.setItem("sketchtale.access-token.v1", "test-token"),
  );
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    (route) => {
      const path = new URL(route.request().url()).pathname;
      if (route.request().method() !== "GET") writes.push(path);
      const data =
        path === "/api/auth/profile"
          ? { id: "p-demo", name: "Mai", role: "Parent" }
          : path === "/api/child-profiles"
            ? [
                child,
                {
                  ...child,
                  id: "second-child",
                  nickName: "Nắng",
                  targetAgeGroup: "Ag6to7",
                },
              ]
            : path === `/api/child-profiles/${id}`
              ? child
              : path === "/api/subscription-plans"
                ? [
                    {
                      id: "plus",
                      code: "plus",
                      name: "Plus",
                      price: 49000,
                      isActive: true,
                      childProfileLimit: 3,
                      durationDays: 30,
                    },
                  ]
                : path === "/api/education-themes"
                  ? [{ id: "nature", name: "Nature" }]
                  : path === "/api/story-template/stories"
                    ? [story]
                    : path === "/api/story-template/stories/garden"
                      ? story
                      : null;
      return route.fulfill({
        status: data ? 200 : 501,
        json: data || { message: "Unexpected request" },
      });
    },
  );
  return writes;
}
for (const width of [390, 768, 1366])
  test(`parent demo responsive ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const [slug, path, heading] of [
      ["overview", "/parent", "Hôm nay, mình đồng hành cùng ai?"],
      ["child", `/parent/children/${id}`, "Một tuần khám phá của Mây"],
      [
        "report",
        `/parent/children/${id}/progress`,
        "Cùng nhìn lại hành trình đọc",
      ],
      ["plans", "/parent/plan", "Chọn gói phù hợp với nhịp đọc"],
      ["library", "/parent/library", "Chọn một câu chuyện hôm nay"],
      ["checkout", "/parent/checkout?plan=plus", "Chọn phương thức thanh toán"],
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `artifacts/parent-v2-${slug}-${width}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
test("demo settings approvals favorites recommendation and payment work without backend mutations", async ({
  page,
}) => {
  const writes = await setup(page);
  await page.goto(`/parent/children/${id}/settings`);
  await page.getByLabel("Mục tiêu đọc mỗi ngày").selectOption("20");
  await page.getByRole("button", { name: "Lưu lựa chọn demo" }).click();
  await page.reload();
  await expect(page.getByLabel("Mục tiêu đọc mỗi ngày")).toHaveValue("20");
  await page.getByRole("link", { name: "Phê duyệt", exact: true }).click();
  await page
    .getByRole("button", { name: "Đồng ý", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Đã đồng ý", { exact: true }).last(),
  ).toBeVisible();
  await page.goto("/parent/library");
  await page
    .getByRole("button", { name: "Lưu Khu vườn của Mây", exact: true })
    .click();
  await page.getByRole("button", { name: "Đã lưu (1)" }).click();
  await page
    .getByRole("button", { name: "Xem trước Khu vườn của Mây" })
    .click();
  await page.getByRole("combobox", { name: "Chọn bé", exact: true }).selectOption(id);
  await page.getByRole("button", { name: "Gợi ý cho bé", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu gợi ý");
  await page.goto(`/parent/children/${id}/library`);
  await expect(page.getByText("Bố mẹ vừa gợi ý · Demo")).toBeVisible();
  await page.goto("/parent/plan");
  await expect(page.getByText("SO SÁNH NHANH")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Xem các gói", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Chọn Plus" }).click();
  await page.getByLabel("Kịch bản demo").selectOption("failed");
  await page.getByRole("button", { name: "Xác nhận thanh toán demo" }).click();
  await expect(page.getByRole("alert")).toContainText("chưa thành công");
  await page.getByLabel("Kịch bản demo").selectOption("success");
  await page.getByRole("button", { name: "Thử thanh toán lại" }).click();
  await expect(
    page.getByRole("heading", { name: "Đăng ký Plus thành công — demo" }),
  ).toBeVisible();
  expect(writes).toEqual([]);
});

test("profile avatar persists and report/export demos download samples", async ({page}) => {
 const writes=await setup(page);
 await page.goto(`/parent/children/${id}/profile`);
 await page.getByRole("radio",{name:"Biểu tượng 3"}).check();
 await page.getByRole("button",{name:"Lưu thông tin demo"}).click();
 await page.goto("/parent");
 await expect(page.getByRole("link",{name:/Mây.*8–10 tuổi/}).locator(".family-avatar-2")).toBeVisible();
 await page.goto(`/parent/children/${id}/progress`);
 await page.getByRole("button",{name:"30 ngày",exact:true}).click();
 await expect(page.getByText("382 phút",{exact:true})).toBeVisible();
 const report=page.waitForEvent("download");
 await page.getByRole("button",{name:"Tải báo cáo mẫu"}).click();
 expect((await report).suggestedFilename()).toBe("bao-cao-minh-hoa.txt");
 await page.getByRole("link",{name:"Bản xuất",exact:true}).click();
 await page.getByRole("button",{name:"Tạo bản xuất demo"}).click();
 await expect(page.getByText("PDF · Hoàn tất mô phỏng")).toBeVisible();
 await page.goto("/parent/checkout?plan=plus");
 await page.getByLabel("Kịch bản demo").selectOption("cancelled");
 await page.getByRole("button",{name:"Xác nhận thanh toán demo"}).click();
 await expect(page.getByRole("alert")).toContainText("Đã hủy thanh toán demo");
 expect(writes).toEqual([]);
});
