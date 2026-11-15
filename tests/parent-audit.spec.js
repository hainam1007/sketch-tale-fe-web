import { test, expect } from "@playwright/test";

const childId = "11111111-1111-1111-1111-111111111111";
const otherChildId = "22222222-2222-2222-2222-222222222222";
const characterId = "33333333-3333-3333-3333-333333333333";

async function setup(page) {
  const state = { writes: [], paths: [], failRead: false, wrongProfile: false, wrongCharacter: false, approved: false, failInbox: false };
  let child = { childProfileId: childId, nickName: "Mây", dailyTimeLimit: 30, dailyCharacterLimit: 3 };
  const character = { characterId, childProfileId: childId, childNickName: "Mây", characterName: "Thỏ", status: 1, finalImageUrl: "https://images.example.test/rabbit.svg" };
  await page.addInitScript(() => {
    localStorage.setItem("sketchtale.access-token.v1", "parent-a");
    localStorage.setItem("sketchtale.auth-session-id.v1", "session-a");
  });
  await page.route("https://images.example.test/**", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="blue"/></svg>' }));
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    state.paths.push(`${req.method()} ${path}`);
    if (path === "/api/auth/profile") return route.fulfill({ json: { id: "parent-a", name: "Parent A", role: "Parent" } });
    if (path === "/api/child-profiles") return route.fulfill({ json: [child] });
    if (path === `/api/child-profiles/${childId}`) {
      if (req.method() === "PUT") {
        state.writes.push(req.postDataJSON());
        child = { ...child, ...req.postDataJSON() };
        return route.fulfill({ json: { message: "Saved" } });
      }
      if (state.failRead && state.writes.length) return route.fulfill({ status: 503, json: { message: "Read unavailable" } });
      return route.fulfill({ json: { ...child, childProfileId: state.wrongProfile ? otherChildId : childId } });
    }
    if (path === "/api/characters/pending-approval") {
      if (state.approved && state.failInbox) return route.fulfill({ status: 503, json: { message: "Inbox unavailable" } });
      return route.fulfill({ json: state.approved ? [] : [character] });
    }
    if (path === `/api/characters/${characterId}`) return route.fulfill({ json: { ...character, childProfileId: state.wrongCharacter ? otherChildId : childId, status: state.approved ? 2 : 1 } });
    if (path === `/api/characters/${characterId}/approve`) {
      expect(req.method()).toBe("PUT");
      expect(req.postData()).toBeNull();
      state.approved = true;
      return route.fulfill({ json: { message: "Approved" } });
    }
    if (path === `/api/child-quiz-answers/child-profiles/${childId}`) return route.fulfill({ json: [] });
    return route.fulfill({ status: 501, json: { message: `Unexpected ${path}` } });
  });
  return state;
}

test.beforeEach(async ({ page }, info) => {
  void page;
  test.skip(info.project.name !== "parent-live", "Owner-scoped real adapters");
});

test("profile accepted PUT then failed read-back offers GET-only recovery", async ({ page }) => {
  const state = await setup(page);
  state.failRead = true;
  await page.goto(`/parent/children/${childId}/settings`);
  await page.getByLabel("Tên hiển thị của bé").fill("Mây mới");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  const recovery = page.getByRole("button", { name: "Tải lại hồ sơ đã lưu" });
  await expect(recovery).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu thay đổi", exact: true })).toBeDisabled();
  expect(state.writes).toHaveLength(1);
  state.failRead = false;
  await recovery.click();
  await expect(recovery).toHaveCount(0);
  await expect(page.getByLabel("Tên hiển thị của bé")).toHaveValue("Mây mới");
  expect(state.writes).toHaveLength(1);
});

test("wrong child response fails closed without opening an editor", async ({ page }) => {
  const state = await setup(page);
  state.wrongProfile = true;
  await page.goto(`/parent/children/${childId}/settings`);
  await expect(page.getByText("Backend trả về hồ sơ không đúng bé đang chọn.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu thay đổi", exact: true })).toHaveCount(0);
  expect(state.writes).toEqual([]);
});

test("inline rename sends no stale daily caps", async ({ page }) => {
  const state = await setup(page);
  await page.goto(`/parent/children/${childId}`);
  await page.getByRole("button", { name: "Đổi tên Mây" }).click();
  await page.getByLabel("Tên bé", { exact: true }).fill("Mây mới");
  await page.getByRole("button", { name: "Lưu tên bé" }).click();
  await expect(page.getByRole("heading", { name: "Mây mới", exact: true })).toBeVisible();
  expect(state.writes).toEqual([{ nickName: "Mây mới" }]);
});

test("quiz route remains reachable and never requests demo progress", async ({ page }) => {
  const state = await setup(page);
  await page.goto(`/parent/children/${childId}/progress`);
  await expect(page.getByText("Chưa có kết quả quiz", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/${childId}/progress$`));
  expect(state.paths).toContain(`GET /api/child-quiz-answers/child-profiles/${childId}`);
  expect(state.paths.some(path => path.includes("/children/") && path.includes("progress"))).toBe(false);
  await expect(page.getByText("96 phút")).toHaveCount(0);
});

test("approval validates child identity and cannot decide from wrong detail", async ({ page }) => {
  const state = await setup(page);
  state.wrongCharacter = true;
  await page.goto(`/parent/children/${childId}/approvals`);
  await expect(page.getByText("Chi tiết nhân vật không khớp với bé và yêu cầu đang chọn.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Duyệt nhân vật", exact: true })).toBeDisabled();
  expect(state.approved).toBe(false);
});

test("accepted approval cannot be repeated when inbox refresh fails", async ({ page }) => {
  const state = await setup(page);
  state.failInbox = true;
  await page.goto(`/parent/children/${childId}/approvals`);
  const approve = page.getByRole("button", { name: "Duyệt nhân vật", exact: true });
  await expect(approve).toBeEnabled();
  await approve.click();
  await expect(page.getByText("Inbox unavailable")).toBeVisible();
  expect(state.paths.filter(path => path.endsWith("/approve"))).toHaveLength(1);
  state.failInbox = false;
  await page.getByRole("button", { name: /Thử lại/ }).click();
  await expect(page.getByText("Không có yêu cầu chờ duyệt", { exact: true })).toBeVisible();
  expect(state.paths.filter(path => path.endsWith("/approve"))).toHaveLength(1);
});

test("late successful mutation after account switch does not read back as next parent", async ({ page }) => {
  await setup(page);
  await page.goto("/payment/success");
  let release;
  const held = new Promise(resolve => { release = resolve; });
  let received;
  const started = new Promise(resolve => { received = resolve; });
  let reads = 0;
  await page.route(`**/api/child-profiles/${childId}`, async route => {
    if (route.request().method() === "PUT") {
      received();
      await held;
      await route.fulfill({ json: { message: "Saved" } });
    } else { reads++; await route.fulfill({ json: { childProfileId: childId, nickName: "Mây" } }); }
  });
  const result = page.evaluate(async childId => {
    const { parentProfileService } = await import("/src/features/parent/services/parentProfileService.js");
    try { await parentProfileService.update({ childId, nickName: "Late" }); return "unexpected-success"; }
    catch (error) { return error.code; }
  }, childId);
  await started;
  await page.evaluate(async () => {
    const { setTokenPair } = await import("/src/lib/api/authTokenStorage.js");
    setTokenPair({ accessToken: "parent-b", refreshToken: "refresh-b" });
  });
  release();
  expect(await result).toBe("SESSION_CHANGED");
  expect(reads).toBe(0);
});

test("forged payment return never calls cancel or grants entitlement", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/payment/success?status=PAID&code=00&orderCode=9223372036854775807");
  await expect(page.getByRole("heading", { name: "Đang chờ xác nhận giao dịch" })).toBeVisible();
  expect(state.paths.some(path => /payments|subscriptions|credit-transaction/.test(path))).toBe(false);
});

async function readerSetup(page, { invalid = false } = {}) {
  const state = await setup(page);
  const composition = { schemaVersion: invalid ? 99 : 1, background: { mode: "none" }, subtitles: null,
    imageObjects: [{ id: "image", assetId: "image-asset", x: 20, y: 25, scale: 1 }],
    animationClips: [{ id: "motion", targetId: "image", kind: "path", startMs: 0, durationMs: 3000, points: [{ x: 20, y: 25 }, { x: 80, y: 25 }] }],
    audioTracks: [], slotExtensions: { slot: { rotation: 15 } }, quizExtensions: {},
    assets: [{ id: "image-asset", kind: "image", url: "https://images.example.test/rabbit.svg" }] };
  await page.route("**/api/story-template/stories/story", route => route.fulfill({ json: { id: "story", title: "Reader test", status: 2 } }));
  await page.route("**/api/storypage-template/pages/story", route => route.fulfill({ json: [
    { id: "page", storyTemplateId: "story", pageNumber: 1, rawText: "Lời kể trang một", status: 2, compositionJson: JSON.stringify(composition) },
    { id: "page2", storyTemplateId: "story", pageNumber: 2, rawText: "Trang hai", status: 2 },
  ] }));
  await page.route("**/api/story-template/story/roles", route => route.fulfill({ json: [{ id: "role", storyTemplateId: "story", roleName: "Thỏ", defaultAssetUrl: "https://images.example.test/rabbit.svg", status: 2 }] }));
  await page.route("**/api/story-pages/*/slots", route => route.fulfill({ json: route.request().url().includes("/page/") ? [{ id: "slot", storyPageId: "page", storyRoleTemplateId: "role", posX: 60, posY: 50, scale: 1, status: 2 }] : [] }));
  await page.route("**/api/education-themes", route => route.fulfill({ json: [] }));
  return state;
}

test("reader hydrates v1, role slots, captions and seeks without editor storage", async ({ page }) => {
  await readerSetup(page);
  await page.goto("/parent/library/story/read");
  await expect(page.getByText("Lời kể trang một", { exact: true })).toBeVisible();
  await expect(page.locator(".story-preview-slot")).toHaveCount(2);
  const seek = page.getByRole("slider", { name: "Vị trí phát" });
  await seek.fill("1500");
  await expect(page.locator(".story-preview-slot").first()).toHaveCSS("left", /px$/);
  const left = await page.locator(".story-preview-slot").last().evaluate(el => el.style.left);
  expect(left).toBe("50%");
  await page.getByRole("button", { name: "Trang tiếp theo" }).click();
  await expect(page.getByText("Trang hai", { exact: true })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Vị trí phát" })).toHaveValue("0");
  await expect(page.getByRole("button", { name: "Phát trang" })).toBeVisible();
});

test("reader rejects unknown composition instead of silently rendering background only", async ({ page }) => {
  await readerSetup(page, { invalid: true });
  await page.goto("/parent/library/story/read");
  await expect(page.getByText(/bố cục bị lỗi hoặc chưa được hỗ trợ/)).toBeVisible();
  await expect(page.locator(".story-preview-stage")).toHaveCount(0);
});

test("concurrent expired requests share refresh and logout rejects a late refresh response", async ({ page }) => {
  await setup(page);
  await page.goto("/payment/success");
  await page.evaluate(async () => {
    const { setTokenPair } = await import("/src/lib/api/authTokenStorage.js");
    setTokenPair({ accessToken: "expired", refreshToken: "refresh-a" });
  });
  let refreshes = 0;
  await page.route("**/api/education-themes", route => route.fulfill(route.request().headers().authorization === "Bearer expired" ? { status: 401 } : { json: [] }));
  await page.route("**/api/auth/refresh-token", async route => {
    refreshes++;
    expect(route.request().headers().authorization).toBe("Bearer expired");
    expect(route.request().postDataJSON()).toEqual({ refreshToken: "refresh-a" });
    await route.fulfill({ json: { token: "fresh", refreshToken: "refresh-next" } });
  });
  const responses = await page.evaluate(async () => {
    const { apiRequest } = await import("/src/lib/api/httpClient.js");
    return Promise.all([apiRequest({ path: "/education-themes" }), apiRequest({ path: "/education-themes" })]);
  });
  expect(responses).toEqual([[], []]);
  expect(refreshes).toBe(1);
  let release, reached;
  const held = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { reached = resolve; });
  await page.route("**/api/education-themes", route => route.fulfill({ status: 401 }));
  await page.route("**/api/auth/refresh-token", async route => { reached(); await held; await route.fulfill({ json: { token: "late", refreshToken: "late-refresh" } }); });
  const pending = page.evaluate(async () => {
    const { apiRequest } = await import("/src/lib/api/httpClient.js");
    try { await apiRequest({ path: "/education-themes" }); return "unexpected-success"; } catch (e) { return e.code; }
  });
  await started;
  await page.evaluate(async () => { const { clearTokens } = await import("/src/lib/api/authTokenStorage.js"); clearTokens(); });
  release();
  expect(await pending).toBe("SESSION_CHANGED");
  expect(await page.evaluate(() => localStorage.getItem("sketchtale.access-token.v1"))).toBeNull();
});
