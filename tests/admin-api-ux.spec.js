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
    else if (path === "/api/education-themes") data = [{ id: "theme-1", nameVi: "Gia đình", nameEn: "Family", description: "Chủ đề gia đình", status: 2 }];
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
  await expect(page.getByText("Trang 2 / 2")).toBeVisible();
  await page.getByLabel("Trạng thái báo cáo").selectOption("2");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await expect(page.locator(".admin-demo-banner")).toHaveCount(0);
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(10);
});

test("reports and audit resolve actors from the user directory", async ({ page }) => {
  await page.route("**/api/users", (route) => route.fulfill({ json: [
    { id: actor, firstName: "Lan", lastName: "Nguyen", email: "lan@example.test", role: "Parent" },
  ] }));

  await page.goto("/admin/reports");
  await expect(page.getByText("Lan Nguyen").first()).toBeVisible();
  await expect(page.getByText("lan@example.test").first()).toBeVisible();

  await page.goto("/admin/audit");
  await expect(page.getByText("Lan Nguyen").first()).toBeVisible();
  await expect(page.getByText("lan@example.test").first()).toBeVisible();
  await expect(page.locator("tbody tr").first().locator("td").nth(3)).toContainText("Phụ huynh");
});

test("missing report and audit actors stay blank", async ({ page }) => {
  await page.route("**/api/users", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/content-reports", (route) => route.fulfill({ json: [
    { id: "report-empty-actor", targetId: actor, reason: "No actor in source data", status: 0, targetType: 0, createBy: "00000000-0000-0000-0000-000000000000" },
  ] }));
  await page.route("**/api/audit-logs", (route) => route.fulfill({ json: [
    { id: "audit-empty-actor", createBy: "00000000-0000-0000-0000-000000000000", auditAction: "Update", entityName: "StoryTemplate", createdAt: new Date().toISOString() },
  ] }));

  await page.goto("/admin/reports");
  const reporterCell = page.locator("tbody tr").first().locator("td").first();
  await expect(reporterCell).not.toContainText("00000000");
  await expect(reporterCell).not.toContainText("Người dùng");

  await page.goto("/admin/audit");
  const actorCell = page.locator("tbody tr").first().locator("td").nth(1);
  await expect(actorCell).toHaveText("");
});

test("catalog reads detail before editing", async ({ page }) => {
  await page.goto("/admin/subscription-plans");
  await page.getByRole("button", { name: "Chỉnh sửa" }).click();
  await expect(page.getByLabel("Tên gói", { exact: false })).toHaveValue("Latest plan");
});

test("admin list pages fit desktop and mobile", async ({ page }) => {
  test.setTimeout(90_000);
  for (const path of ["audit", "reports", "char-types", "education-themes", "subscription-plans", "users", "permissions", "system-limits", "monitoring", "statistics"]) {
    await page.goto(`/admin/${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const width of [1366, 768, 390]) {
      await page.setViewportSize({ width, height: 850 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect.poll(() => page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, overflowing: [...document.querySelectorAll("main *")].filter((node) => node.getBoundingClientRect().right > innerWidth && getComputedStyle(node).position !== "absolute").slice(0, 8).map((node) => node.className || node.tagName) })), { message: `${path} at ${width}px` }).toMatchObject({ width, document: width });

    }
  }
});


test("users decode envelope and lockout; edit sends changed fields without role", async ({ page }) => {
  const target = { id: "target-1", username: "qa", email: "qa@example.com", firstName: "Old", lastName: null, dob: null, gender: false, role: "Parent", isLockedOut: true, parentProfile: null };
  let writes = [];
  await page.route("**/api/parent-profiles", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/users**", async (route) => {
    if (route.request().method() === "PUT") { const body = route.request().postDataJSON(); writes.push(body); Object.assign(target, body); }
    await route.fulfill({ json: { data: new URL(route.request().url()).pathname === "/api/users" ? [target] : target, message: "OK" } });
  });
  await page.goto("/admin/users/target-1");
  await expect(page.getByText("Đã khóa", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sửa thông tin tài khoản" }).click();
  await expect(page.getByLabel("Số điện thoại")).toBeDisabled();
  await page.getByLabel("Tên", { exact: true }).fill("");
  await page.getByRole("combobox", { name: "Giới tính", exact: true }).selectOption("true");
  await page.getByRole("button", { name: "Lưu tài khoản" }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toEqual({ firstName: "", gender: true });
});

test("create maps ContentManager role and Child creation stays disabled", async ({ page }) => {
  let payload;
  await page.route("**/api/parent-profiles", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/users", (route) => {
    if (route.request().method() === "POST") payload = route.request().postDataJSON();
    return route.fulfill({ json: { data: payload ? { id: "created" } : [] } });
  });
  await page.goto("/admin/users");
  await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();
  await expect(page.locator('option[value="child"]')).toHaveJSProperty("disabled", true);
  const result = await page.evaluate(async () => {
    const { adminService } = await import('/src/features/admin/services/adminService.js');
    return adminService.createUser({ payload: { username: "qa", password: "test-password", role: "content_manager" } });
  });
  expect(result.id).toBe("created");
  expect(payload.role).toBe("ContentManager");
});

test("character form saves deployed schema and preserves false and zero", async ({ page }) => {
  let payload;
  const item = { id: "type-1", nameVi: "Mèo", nameEn: "Cat", category: 0, canFly: false, canSwim: false, imageUrl: null, status: 2 };
  await page.route("**/api/char-types**", (route) => {
    if (route.request().method() === "PATCH") { payload = route.request().postDataJSON(); return route.fulfill({ status: 204 }); }
    return route.fulfill({ json: new URL(route.request().url()).pathname.endsWith("type-1") ? item : [item] });
  });
  await page.goto("/admin/char-types");
  await expect(page.getByText("Mèo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sửa mục" }).click();
  await page.getByLabel("Tên tiếng Việt").fill("Mèo mới");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect.poll(() => payload).toBeTruthy();
  expect(payload).toMatchObject({ nameVi: "Mèo mới", nameEn: "Cat", category: 0, canFly: false, canSwim: false, status: 2 });
  expect(payload).not.toHaveProperty("name");
});

test("report accepted write with failed read-back never resubmits and preserves reason", async ({ page }) => {
  let writes = 0;
  const item = { id: "report-1", targetId: actor, targetType: 0, reason: "Original complaint", status: 0, createBy: actor };
  await page.route("**/api/content-reports/report-1", async (route) => {
    if (route.request().method() === "PATCH") {
      writes++;
      expect(route.request().postDataJSON()).toEqual({ status: 2, reason: item.reason, targetId: actor, targetType: 0 });
      return route.fulfill({ status: 204 });
    }
    return writes ? route.fulfill({ status: 503, json: { message: "Read unavailable" } }) : route.fulfill({ json: item });
  });
  await page.goto("/admin/reports/report-1");
  await page.getByRole("button", { name: "Đã giải quyết vi phạm" }).click();
  await expect(page.getByText("Chưa đọc lại được báo cáo", { exact: false })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: "Đã giải quyết vi phạm" })).toBeDisabled();
  await page.getByRole("button", { name: "Đọc lại trạng thái" }).click();
  expect(writes).toBe(1);
});

test("admin adapters preserve errors and reject partial totals", async ({ page }) => {
  await page.goto("/admin");
  for (const status of [400, 401, 403, 404, 409]) {
    await page.route("**/api/content-reports/error", (route) => route.fulfill({ status, json: { message: "Expected failure" } }));
    await page.route("**/api/auth/refresh-token", (route) => route.fulfill({ status: 401, json: { message: "Expired" } }));
    const result = await page.evaluate(async () => {
      const { adminService } = await import('/src/features/admin/services/adminService.js');
      try { await adminService.getContentReport({ reportId: "error" }); } catch (error) { return error.status; }
    });
    expect(result).toBe(status);
  }
  await page.route("**/api/users", (route) => route.fulfill({ json: { items: [{ id: actor }], total: 100, totalPages: 10 } }));
  const counts = await page.evaluate(async () => {
    const { adminService } = await import('/src/features/admin/services/adminService.js');
    return (await adminService.getOverview()).counts;
  });
  expect(counts.totalUsers).toBeNull();
});

test("audit missing actor never invents system identity", async ({ page }) => {
  await page.goto("/admin/audit");
  const result = await page.evaluate(async () => {
    const { resolveUserFromDirectory } = await import('/src/features/admin/services/adminService.js');
    return resolveUserFromDirectory("00000000-0000-0000-0000-000000000000");
  });
  expect(result.email).toBe("");
  expect(result.role).toBe("");
  expect(result.name).toBe("");
});


test("late admin response cannot populate a new account session", async ({ page }) => {
  await page.goto("/admin");
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route("**/api/users/late", async (route) => { await gate; await route.fulfill({ json: { data: { id: "late", role: "Admin" } } }); });
  const requested = page.waitForRequest("**/api/users/late");
  const result = page.evaluate(async () => {
    const { apiRequest } = await import('/src/lib/api/httpClient.js');
    try { await apiRequest({ path: '/users/late', forceReal: true }); return 'unexpected-success'; } catch (error) { return error.code; }
  });
  await requested;
  await page.evaluate(async () => {
    const { setTokenPair } = await import('/src/lib/api/authTokenStorage.js');
    setTokenPair({ accessToken: 'other-account', refreshToken: 'other-refresh' }, true);
  });
  release();
  expect(await result).toBe("SESSION_CHANGED");
});

test("catalog writes omit server metadata and generated code", async ({ page }) => {
  let payload;
  await page.goto("/admin");
  await page.route("**/api/subscription-plans/plan-1", (route) => { payload = route.request().postDataJSON(); return route.fulfill({ status: 204 }); });
  await page.evaluate(async () => {
    const { adminCatalogService } = await import('/src/features/admin/services/adminCatalogService.js');
    await adminCatalogService.update({ kind: 'plans', id: 'plan-1', payload: { id: 'plan-1', code: 'IGNORED', createdAt: 'old', name: 'Free', price: 0, isActive: false } });
  });
  expect(payload).toEqual({ name: "Free", price: 0, isActive: false });
});


test("dashboard leaves unavailable metrics and charts empty", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Tổng quan doanh thu" })).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Chưa có API doanh thu", { exact: true })).toHaveCount(0);
  await expect(page.locator(".admin-revenue-chart-wrap")).toHaveCount(0);
  await expect(page.locator(".admin-revenue-packages-section")).toHaveCount(0);
  await expect(page.locator(".admin-revenue-kpi-value").first()).toBeEmpty();
});


test("education themes use Vietnamese and English DTO fields and compact filters", async ({ page }) => {
  const items = [
    { id: "theme-1", nameVi: "Gia đình", nameEn: "Family", description: "Yêu thương và quan tâm trong gia đình", status: 2 },
    { id: "theme-2", nameVi: "Thiên nhiên", nameEn: "Nature", description: "Chăm sóc môi trường", status: 3 },
  ];
  let payload;
  await page.route("**/api/education-themes**", async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === "PATCH") {
      payload = route.request().postDataJSON();
      Object.assign(items[0], payload);
      return route.fulfill({ status: 204 });
    }
    const result = url.pathname.endsWith("theme-1") ? items[0] : items;
    return route.fulfill({ json: result });
  });
  await page.goto("/admin/education-themes");
  await expect(page.getByText("Gia đình", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Family", { exact: true })).toBeVisible();
  await expect(page.getByText("Chưa thiết lập", { exact: true })).toHaveCount(0);
  await expect(page.locator(".admin-catalog-toolbar")).toHaveCSS("display", "grid");
  await expect(page.getByLabel("Tìm trong danh sách")).toBeVisible();
  await page.getByLabel("Tìm trong danh sách").fill("Gia đình");
  await expect(page.locator(".admin-catalog-tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Chỉnh sửa Gia đình" }).click();
  await expect(page.getByLabel("Tên chủ đề (Tiếng Việt)")).toHaveValue("Gia đình");
  await expect(page.getByLabel("Tên chủ đề (Tiếng Anh)")).toHaveValue("Family");
  await page.getByLabel("Tên chủ đề (Tiếng Việt)").fill("Gia đình và bạn bè");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Xác nhận lưu" }).click();
  await expect.poll(() => payload).toMatchObject({ nameVi: "Gia đình và bạn bè", nameEn: "Family", status: 2 });
  expect(payload).not.toHaveProperty("name");
});
