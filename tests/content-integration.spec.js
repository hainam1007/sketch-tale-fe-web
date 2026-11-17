import { test, expect } from "@playwright/test";
import { parseStoryComposition, serializeCompositionString } from "../src/features/content/services/storyComposition.js";

const storyId = "11111111-1111-1111-1111-111111111111";
const pageId = "22222222-2222-2222-2222-222222222222";
const composition = () => ({ schemaVersion: 1, background: { mode: "none" }, subtitles: null, imageObjects: [], animationClips: [], audioTracks: [], slotExtensions: {}, quizExtensions: {}, assets: [], extensions: { future: true } });

async function setup(page, existing, role = "ContentManager") {
  const state = existing || {
    story: { id: storyId, title: "Audit story", educationThemeId: "theme", ageGroup: 0, status: 0 },
    pages: [{ id: pageId, storyTemplateId: storyId, pageNumber: 1, rawText: "Before", status: 0, compositionJson: JSON.stringify(composition()) }],
    writes: [], paths: [], roles: [], slots: [], quizzes: [], vocabulary: [], failRead: false, failPut: false, delay: null,
  };
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const req = route.request(); const path = new URL(req.url()).pathname;
    state.paths.push(`${req.method()} ${path}`);
    const json = data => route.fulfill({ json: data });
    if (path === "/api/auth/login") return json({ token: "intercept-token", refreshToken: "intercept-refresh" });
    if (path === "/api/auth/profile") return json({ id: role === "Parent" ? "parent-test" : "cm-test", role, name: "Test account" });
    if (path === "/api/education-themes") return json([{ id: "theme", name: "Theme" }]);
    if (path === "/api/story-template/all-stories" || path === "/api/story-template/stories") return json([state.story]);
    if (path === `/api/story-template/stories/${storyId}`) return json(state.story);
    if (path === `/api/story-template/${storyId}/publish`) { state.writes.push("publish"); state.story.status = 2; return json({ status: 2 }); }
    if (path.includes("/all-pages/") || path.includes("/pages/")) return json(state.pages);
    if (path === `/api/storypage-template/page/${pageId}`) {
      if (state.failRead && state.writes.length) return route.fulfill({ status: 503, json: { message: "Read failed" } });
      return json(state.pages[0]);
    }
    if (path === `/api/storypage-template/${pageId}` && req.method() === "PUT") {
      const body = req.postData(); state.writes.push(body);
      if (state.failPut) return route.fulfill({ status: 503, json: { message: "Unknown outcome" } });
      const field = name => body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([\\s\\S]*?)\\r\\n--`))?.[1];
      state.pages[0] = { ...state.pages[0], rawText: field("RawText"), status: Number(field("Status")), compositionJson: field("CompositionJson") ?? null };
      if (state.delay) await state.delay;
      return json({ message: "Saved" });
    }
    if (/\/(all-roles|roles)$/.test(path)) return json(state.roles);
    if (path === `/api/story-pages/${pageId}/slot`) {
      const slot = { id: "55555555-5555-5555-5555-555555555555", storyPageId: pageId, status: 2, ...req.postDataJSON() };
      state.slots.push(slot); return json(slot);
    }
    if (path.endsWith("/slots")) return json(state.slots);
    if (/\/(all-quizzes|quizzes)$/.test(path)) return json(state.quizzes);
    if (path.endsWith("/vocabularies")) return json(state.vocabulary.filter(word => path.includes(word.storyPageTemplateId)));
    if (path === "/api/upload/background-image") return route.fulfill({ status: 403, json: { message: "Forbidden" } });
    return route.fulfill({ status: 501, json: { message: `Unexpected ${path}` } });
  });
  await page.goto("/");
  return state;
}

async function update(page, payload = {}) {
  return page.evaluate(async ({ storyId, pageId, payload }) => {
    const { contentService } = await import("/src/features/content/services/contentService.js");
    try { return { story: await contentService.updatePage({ storyId, pageId, text: "After", status: 0, ...payload }) }; }
    catch (error) { return { code: error.code, accepted: !!error.mutationAccepted, unknown: !!error.mutationOutcomeUnknown }; }
  }, { storyId, pageId, payload });
}

test("codec handles malformed structure, null/empty and future version without throwing", () => {
  for (const raw of [null, ""]) expect(parseStoryComposition(raw).kind).toBe("legacy");
  expect(parseStoryComposition("{").kind).toBe("invalid");
  expect(parseStoryComposition(JSON.stringify({ schemaVersion: 1 })).issues.length).toBeGreaterThan(0);
  expect(parseStoryComposition(JSON.stringify({ ...composition(), schemaVersion: 2 })).kind).toBe("unsupported");
  for (const subtitles of [null, []]) expect(parseStoryComposition(JSON.stringify({ ...composition(), subtitles })).issues).toEqual([]);
});

test("codec keeps slot override assets and unknown row fields without reviving deleted rows", () => {
  const previous = { ...composition(), subtitles: [{ id: "cue", text: "Old", startMs: 0, durationMs: 1000, future: 42 }, { id: "deleted", text: "Gone", startMs: 0, durationMs: 1000 }] };
  const result = serializeCompositionString({ backgroundMode: "native", subtitles: [{ id: "cue", text: "New", startMs: 0, durationMs: 1000 }], slotExtensions: { slot: { assetId: "asset" } } }, [{ id: "asset", kind: "image", url: "https://media.example.test/a.png" }], previous);
  expect(result.ok).toBe(true);
  expect(result.value.background.mode).toBe("native");
  expect(result.value.assets.map(a => a.id)).toEqual(["asset"]);
  expect(result.value.subtitles).toEqual([{ id: "cue", text: "New", startMs: 0, durationMs: 1000, future: 42 }]);
  expect(result.value.extensions.future).toBe(true);
});

test("codec stores fractional playback times as integer milliseconds without accepting invalid clips", () => {
  const clip = { id: "clip", targetId: "slot", kind: "keyframes", startMs: 1234.567, durationMs: 900.2, keyframes: [{ timeMs: 0, x: 50 }, { timeMs: 900.2, x: 60 }] };
  const page = { backgroundMode: "none", animationClips: [clip] };
  const result = serializeCompositionString(page, []);
  expect(result.ok).toBe(true);
  expect(result.value.animationClips[0]).toMatchObject({ startMs: 1235, durationMs: 900, keyframes: [{ timeMs: 0, x: 50 }, { timeMs: 900, x: 60 }] });
  expect(parseStoryComposition(result.json).issues).toEqual([]);
  expect(clip.startMs).toBe(1234.567);
  for (const patch of [{ targetId: "" }, { kind: "unknown" }, { startMs: -0.2 }, { durationMs: 0 }, { startMs: NaN }]) {
    expect(serializeCompositionString({ ...page, animationClips: [{ ...clip, ...patch }] }, []).ok).toBe(false);
  }
});

test("text-only PUT preserves composition and reload reads saved server data", async ({ page }) => {
  const state = await setup(page); const before = state.pages[0].compositionJson;
  expect((await update(page)).story.pages[0].text).toBe("After");
  expect(state.pages[0].compositionJson).toBe(before);
  await page.reload();
  const saved = await page.evaluate(async storyId => (await import("/src/features/content/services/contentService.js")).contentService.previewStory({ storyId }), storyId);
  expect(saved.pages[0].text).toBe("After");
  expect(saved.pages[0].compositionJson).toBe(before);
  expect(state.writes).toHaveLength(1);
});

test("accepted PUT with failed read-back does not replay mutation", async ({ page }) => {
  const state = await setup(page); state.failRead = true;
  expect(await update(page)).toMatchObject({ code: "CONTENT_PAGE_READBACK_FAILED", accepted: true });
  expect(state.writes).toHaveLength(1);
});

test("ambiguous PUT failure is marked unknown; no automatic retry", async ({ page }) => {
  const state = await setup(page); state.failPut = true;
  expect(await update(page)).toMatchObject({ unknown: true });
  expect(state.writes).toHaveLength(1);
});

test("stale composition and wrong-story page prevent PUT", async ({ page }) => {
  const state = await setup(page);
  expect(await update(page, { expectedCompositionJson: "" })).toMatchObject({ code: "CONTENT_COMPOSITION_CONFLICT" });
  state.pages[0].storyTemplateId = "other";
  expect(await update(page)).toMatchObject({ code: "CONTENT_PAGE_STORY_MISMATCH" });
  expect(state.writes).toHaveLength(0);
});

test("publish rejects server orphan targets before POST", async ({ page }) => {
  const state = await setup(page);
  state.pages[0].compositionJson = JSON.stringify({ ...composition(), slotExtensions: { missing: { rotation: 10 } } });
  const code = await page.evaluate(async storyId => {
    try { await (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }); }
    catch (e) { return e.code; }
  }, storyId);
  expect(code).toBe("CONTENT_COMPOSITION_INVALID");
  expect(state.writes).toHaveLength(0);
});

test("image animation targets are valid without a character slot", async ({ page }) => {
  const state = await setup(page);
  const model = { ...composition(), assets: [{ id: "image-asset", kind: "image", url: "https://media.example.test/image.png" }], imageObjects: [{ id: "image-object", assetId: "image-asset", x: 50, y: 50, scale: 1 }], animationClips: [{ id: "animation", targetId: "image-object", kind: "path", startMs: 0, durationMs: 1000, points: [{ x: 0, y: 0 }, { x: 50, y: 50 }] }] };
  state.pages[0].compositionJson = JSON.stringify(model);
  const result = await update(page);
  expect(result.story.hasUnverifiedComposition).toBe(false);
});

test("upload 403 never falls back to avatar or mock", async ({ page }) => {
  const state = await setup(page);
  const failed = await page.evaluate(async () => {
    try { await (await import("/src/features/content/services/assetService.js")).uploadAsset({ file: new File(["image"], "test.png", { type: "image/png" }) }); return false; }
    catch { return true; }
  });
  expect(failed).toBe(true);
  expect(state.paths).toContain("POST /api/upload/background-image");
  expect(state.paths.some(p => p.includes("/avatar") || p.includes("/content/"))).toBe(false);
});

test("story queue waits for read-back before the next media PUT", async ({ page }) => {
  const state = await setup(page);
  let release; state.delay = new Promise(resolve => { release = resolve; });
  const first = update(page, { text: "First" });
  await expect.poll(() => state.writes.length).toBe(1);
  const second = page.evaluate(async ({ storyId, pageId }) => (await import("/src/features/content/services/contentService.js")).contentService.updatePage({ storyId, pageId, audioFile: new File(["audio"], "narration.mp3", { type: "audio/mpeg" }) }), { storyId, pageId });
  await page.waitForTimeout(150);
  expect(state.writes).toHaveLength(1);
  release(); await first; await second;
  expect(state.writes).toHaveLength(2);
  expect(state.pages[0].rawText).toBe("First");
});

for (const failPut of [false, true]) test(`new slot persists extensions or reports partial success (failure=${failPut})`, async ({ page }) => {
  const state = await setup(page); state.failPut = failPut;
  const roleId = "44444444-4444-4444-4444-444444444444";
  state.roles = [{ id: roleId, storyTemplateId: storyId, status: 2, roleName: "Rabbit", defaultAssetUrl: "https://media.example.test/rabbit.png" }];
  const result = await page.evaluate(async ({ storyId, pageId, roleId }) => {
    try { return { story: await (await import("/src/features/content/services/contentService.js")).contentService.addSlot({ storyId, pageId, roleId, x: 50, y: 50, scale: 1, rotation: 20, layer: 2, assetId: `role-default:${roleId}` }) }; }
    catch (error) { return { accepted: !!error.mutationAccepted }; }
  }, { storyId, pageId, roleId });
  expect(state.slots).toHaveLength(1);
  if (failPut) expect(result.accepted).toBe(true);
  else {
    expect(result.story.roles[0].slots[0].rotation).toBe(20);
    expect(JSON.parse(state.pages[0].compositionJson).slotExtensions[state.slots[0].id].layer).toBe(2);
    expect(result.story.localOnlyChanges.hasChanges).toBe(false);
  }
});

test("edits made during pending save remain dirty and survive reload", async ({ page }) => {
  const state = await setup(page);
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "cm@test.invalid", password: "intercept" }));
  await page.goto(`/content/stories/${storyId}/pages`);
  await page.getByRole("button", { name: "Phụ đề", exact: true }).click();
  const input = page.getByLabel("Nội dung truyện", { exact: true });
  await input.fill("First edit");
  let release; state.delay = new Promise(resolve => { release = resolve; });
  await page.getByRole("button", { name: "Lưu ngay", exact: true }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  await input.fill("Later edit");
  release();
  await expect(page.getByRole("button", { name: "Lưu ngay", exact: true })).toBeEnabled();
  await expect(input).toHaveValue("Later edit");
  expect(state.pages[0].rawText).toBe("First edit");
  await page.reload();
  await page.getByRole("button", { name: "Phụ đề", exact: true }).click();
  await expect(input).toHaveValue("Later edit");
  await page.getByRole("button", { name: "Lưu ngay", exact: true }).click();
  await expect.poll(() => state.pages[0].rawText).toBe("Later edit");
});

test("two saved pages publish then load through reader APIs in a clean context", async ({ page, browser }) => {
  const state = await setup(page);
  state.pages[0].status = 2;
  state.pages.push({ ...state.pages[0], id: "33333333-3333-3333-3333-333333333333", pageNumber: 2, rawText: "Second page" });
  expect((await update(page, { status: 2 })).story.pages).toHaveLength(2);
  await page.evaluate(async storyId => (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }), storyId);
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const reader = await context.newPage();
  try {
    state.paths = [];
    await setup(reader, state, "Parent");
    expect(await reader.evaluate(() => localStorage.length)).toBe(0);
    const result = await reader.evaluate(async storyId => {
      await (await import("/src/features/auth/authService.js")).authService.login({ email: "parent@test.invalid", password: "intercept" });
      return (await import("/src/features/parent/services/parentCatalogService.js")).parentCatalogService.get({ storyId });
    }, storyId);
    expect(result.pages.map(p => p.text)).toEqual(["After", "Second page"]);
    expect(result.pages[0].compositionJson).toBe(state.pages[0].compositionJson);
    expect(state.paths.some(p => /all-pages|all-roles|all-quizzes/.test(p))).toBe(false);
  } finally { await context.close(); }
});

test("reader places vocabulary and practice quizzes without exposing feedback before answering or writing logs", async ({ page }) => {
  const state = await setup(page, undefined, "Parent");
  state.story.status = 2; state.pages[0].status = 2;
  state.pages[0].compositionJson = JSON.stringify({ ...composition(), quizExtensions: { question: { feedback: "Rất tốt cho cây." } } });
  state.pages.push({ ...state.pages[0], id: "33333333-3333-3333-3333-333333333333", pageNumber: 2, compositionJson: JSON.stringify(composition()) });
  state.vocabulary = [{ id: "word", storyPageTemplateId: pageId, word: "Nảy mầm", meaning: "Hạt bắt đầu mọc cây." }];
  state.quizzes = [{ id: "question", storyTemplateId: storyId, status: 2, questionText: "Cây cần nước không?", options: ["Có", "Không"], correctOptionIndex: 0 }, { id: "ending", storyTemplateId: storyId, status: 2, questionText: "Câu hỏi cuối truyện", options: ["A", "B"], correctOptionIndex: 1 }];
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "parent@test.invalid", password: "intercept" }));
  await page.goto(`/parent/library/${storyId}/read`);
  await expect(page.getByText("Hạt bắt đầu mọc cây.", { exact: true })).toBeVisible();
  await expect(page.getByText("Cây cần nước không?", { exact: true })).toBeVisible();
  await expect(page.getByText("Câu hỏi cuối truyện", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Rất tốt cho cây/)).toHaveCount(0);
  await page.getByRole("button", { name: "Có", exact: true }).click();
  await expect(page.getByText(/Đúng rồi! Rất tốt cho cây/)).toBeVisible();
  await page.getByRole("button", { name: /Trang tiếp theo/ }).click();
  await expect(page.getByText("Câu hỏi cuối truyện", { exact: true })).toBeVisible();
  expect(state.paths.some(path => /all-quizzes|reading-logs|child-quiz-answers/.test(path))).toBe(false);
  expect(state.writes).toHaveLength(0);
});

test("reader rejects learning records belonging to another story or page", async ({ page }) => {
  const state = await setup(page);
  state.quizzes = [{ id: "wrong", storyTemplateId: "other", status: 2 }];
  const result = await page.evaluate(async storyId => {
    try { await (await import("/src/features/parent/services/parentReaderActivities.js")).getReaderQuizzes({ story: { id: storyId, pages: [] } }); }
    catch (error) { return error.code; }
  }, storyId);
  expect(result).toBe("PARENT_READER_ACTIVITIES_INVALID");
});
