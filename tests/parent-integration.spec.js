import { test, expect } from "@playwright/test";

const childId = "11111111-1111-1111-1111-111111111111";
async function setup(page, { syncFailure = false } = {}) {
  const state = { creates: 0, profileReads: 0, writes: [], paths: [], failSync: syncFailure };
  let child = { id: childId, nickName: "Bé thật", dailyTimeLimit: 30, dailyCharacterLimit: 3, targetAgeGroup: "Age6To8" };
  await page.addInitScript(() => localStorage.setItem("sketchtale.access-token.v1", "test-token"));
  await page.route((url) => url.pathname.startsWith("/api/"), async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    state.paths.push(path);
    if (path === "/api/auth/profile") {
      state.profileReads++;
      if (state.creates && state.failSync) return route.fulfill({ status: 500, json: { message: "Tạm thời mất kết nối" } });
      return route.fulfill({ json: { id: "parent-test", name: "Mai", role: "Parent", parentProfile: { remainingChildProfile: 3 - state.creates } } });
    }
    if (path === "/api/auth/register/child") {
      state.creates++;
      return route.fulfill({ json: { childProfileId: childId } });
    }
    if (path === "/api/child-profiles") return route.fulfill({ json: [child] });
    if (path === `/api/child-profiles/${childId}`) {
      if (request.method() === "PUT") {
        state.writes.push(request.postDataJSON());
        child = { ...child, ...request.postDataJSON(), nickName: request.postDataJSON().nickName.trim().toUpperCase() };
        return route.fulfill({ json: { message: "Saved" } });
      }
      return route.fulfill({ json: child });
    }
    if (path.includes("/user-story-character-mappings/child/")) return route.fulfill({ json: { items: [], total: 0, page: 1, pageSize: 20 } });
    if (path === "/api/subscription-plans") return route.fulfill({ json: [{ id: "plan-plus", code: "PlusPlan", name: "Plus", price: 49000, isActive: true }] });
    if (path === "/api/story-template/stories") return route.fulfill({ json: [{ id: "story-live", title: "Truyện thật", status: 2, educationThemeId: "theme" }] });
    if (path === "/api/education-themes") return route.fulfill({ json: [{ id: "theme", name: "Thiên nhiên" }] });
    if (path === "/api/story-template/stories/story-live") return route.fulfill({ json: { id: "story-live", title: "Truyện thật", status: 2 } });
    if (path === "/api/storypage-template/published/story-live") return route.fulfill({ json: [{ id: "page-1", pageNumber: 1, rawText: "Nội dung trang đã xuất bản" }] });
    return route.fulfill({ status: 501, json: { message: `Unexpected ${path}` } });
  });
  return state;
}

test("real checkout cannot be opened directly", async ({ page }) => {
  await setup(page);
  await page.goto("/parent/checkout?plan=PlusPlan");
  await expect(page.getByRole("heading", { name: "Thanh toán chưa khả dụng" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xác nhận thanh toán demo" })).toHaveCount(0);
});

test("real child has no demo metrics, stories or settings mutations; update uses server values", async ({ page }, info) => {
  test.skip(info.project.name !== "parent-live", "Requires real child profile mode");
  const state = await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/parent/children/${childId}`);
  await expect(page.getByRole("heading", { name: "Bé thật", exact: true })).toBeVisible();
  await expect(page.getByText("0 yêu cầu chờ bố mẹ")).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu", { exact: true })).toHaveCount(4);
  await expect(page.getByText("96 phút", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Tủ truyện", exact: true }).click();
  await expect(page.getByText("Chưa có dữ liệu tủ truyện riêng của bé để hiển thị.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo bản xuất demo" })).toHaveCount(0);
  await page.getByRole("link", { name: "Cài đặt", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lưu lựa chọn demo" })).toHaveCount(0);
  await page.getByLabel("Tên hiển thị của bé").fill("Tên mới");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page.getByLabel("Tên hiển thị của bé")).toHaveValue("TÊN MỚI");
  expect(state.writes).toEqual([{ nickName: "Tên mới", dailyTimeLimit: 30, dailyCharacterLimit: 3 }]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("unavailable reports and exports keep their route and explain availability", async ({ page }) => {
  await setup(page);
  for (const [route, title] of [["reports", "Báo cáo gia đình"], ["exports", "Xuất truyện"]]) {
    await page.goto(`/parent/${route}`);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/parent/${route}$`));
    await expect(page.getByText("Tính năng này đang được hoàn thiện và chưa khả dụng.")).toBeVisible();
  }
});

test("successful registration with failed refresh retries reads only", async ({ page }, info) => {
  test.skip(info.project.name !== "parent-live", "Requires real child profile mode");
  const state = await setup(page, { syncFailure: true });
  await page.goto("/parent/children/new");
  await page.getByLabel("Tên đăng nhập", { exact: false }).fill("child-test");
  await page.getByLabel("Mật khẩu", { exact: false }).fill("Test123456!");
  await page.getByLabel("Tên hiển thị", { exact: false }).fill("Bé mới");
  await page.getByRole("button", { name: "Tạo tài khoản bé", exact: true }).click();
  const retry = page.getByRole("button", { name: "Tải lại dữ liệu gia đình" });
  await expect(retry).toBeVisible();
  expect(state.creates).toBe(1);
  expect(state.profileReads).toBeGreaterThan(1);
  state.failSync = false;
  await retry.click();
  await expect(retry).toHaveCount(0);
  expect(state.creates).toBe(1);
  await expect(page.getByRole("link", { name: "Mở hồ sơ bé" })).toHaveAttribute("href", `/parent/children/${childId}`);
});

test("catalog reader works when profiles are disabled without requesting them", async ({ page }, info) => {
  test.skip(info.project.name !== "parent-catalog-only", "Requires profiles disabled");
  const state = await setup(page);
  await page.goto("/parent/library?story=story-live");
  await expect(page.getByText("Nội dung trang đã xuất bản")).toBeVisible();
  await expect(page.getByText("Chưa thể tải danh sách hồ sơ bé để chọn người nhận.")).toBeVisible();
  expect(state.paths).not.toContain("/api/child-profiles");
});
