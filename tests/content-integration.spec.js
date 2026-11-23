import { test, expect } from "@playwright/test";
import { parseStoryComposition, serializeCompositionString } from "../src/features/content/services/storyComposition.js";
import { mapVocabularyDto, vocabularyAppearsInRawText } from "../src/features/content/services/vocabularyContract.js";

const storyId = "11111111-1111-1111-1111-111111111111";
const pageId = "22222222-2222-2222-2222-222222222222";
const composition = () => ({ schemaVersion: 1, background: { mode: "none" }, subtitles: null, imageObjects: [], animationClips: [], audioTracks: [], slotExtensions: {}, quizExtensions: {}, assets: [], extensions: { future: true } });

async function setup(page, existing, role = "ContentManager") {
  const state = existing || {
    story: { id: storyId, title: "Audit story", educationThemeId: "theme", coverImageUrl: "https://media.example.test/cover.png", ageGroup: 0, status: 0 },
    pages: [{ id: pageId, storyTemplateId: storyId, pageNumber: 1, rawText: "Before", status: 0, compositionJson: JSON.stringify(composition()) }],
    writes: [], vocabularyWrites: [], paths: [], roles: [], slots: [], quizzes: [], vocabulary: [], failRead: false, failPut: false, failPublishReadback: false, rejectPublish: false, failPublishUnknown: false, skipCascade: "", publishCalls: 0, publishResult: null, failVocabularyReadback: false, rejectVocabularyPost: false, delay: null,
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
    if (path === `/api/story-template/${storyId}/publish` && req.method() === "POST") {
      state.publishCalls += 1;
      state.writes.push("publish");
      if (state.rejectPublish) return route.fulfill({ status: 400, json: { message: "Publish rejected" } });
      if (state.failPublishUnknown) return route.fulfill({ status: 503, json: { message: "Publish result unknown" } });
      const transitionDrafts = (rows, group) => state.skipCascade === group ? 0 : rows.filter(row => row.status === 0).map(row => { row.status = 2; return row; }).length;
      const publishedPagesCount = transitionDrafts(state.pages, "pages");
      const publishedRolesCount = transitionDrafts(state.roles, "roles");
      const publishedSlotsCount = transitionDrafts(state.slots, "slots");
      const publishedQuizzesCount = transitionDrafts(state.quizzes, "quizzes");
      state.story.status = 2;
      state.publishResult = { status: 2, totalPages: state.pages.filter(row => row.status !== 3).length, publishedPagesCount, publishedRolesCount, publishedSlotsCount, publishedQuizzesCount };
      return json(state.publishResult);
    }
    if (path === `/api/storypage-template/all-pages/${storyId}` && state.failPublishReadback && state.publishCalls > 0) return route.fulfill({ status: 503, json: { message: "Publish read-back failed" } });
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
    if (path.endsWith("/slots")) {
      const requestedPageId = path.split("/").at(-2);
      return json(state.slots.filter(slot => slot.storyPageId === requestedPageId));
    }
    if (/\/(all-quizzes|quizzes)$/.test(path)) return json(state.quizzes);
    if (path === `/api/story-pages/${pageId}/vocabularies` && req.method() === "POST") {
      const body = req.postDataJSON();
      state.vocabularyWrites.push({ method: req.method(), path, body });
      if (state.rejectVocabularyPost) return route.fulfill({ status: 400, json: { message: "Từ vựng phải xuất hiện trong RawText của trang truyện." } });
      const row = { id: `vocabulary-${state.vocabularyWrites.length}`, storyPageTemplateId: pageId, ...body };
      state.vocabulary.push(row);
      return route.fulfill({ status: 201, json: row });
    }
    if (/\/api\/story-vocabulary\/[^/]+$/.test(path) && req.method() === "PUT") {
      const body = req.postDataJSON();
      state.vocabularyWrites.push({ method: req.method(), path, body });
      const vocabularyId = path.split("/").at(-1);
      const index = state.vocabulary.findIndex((item) => item.id === vocabularyId);
      if (index < 0) return route.fulfill({ status: 404, json: { message: "Vocabulary missing" } });
      state.vocabulary[index] = { ...state.vocabulary[index], ...body };
      return json({ message: "Saved" });
    }
    if (path.endsWith("/vocabularies")) {
      if (state.failVocabularyReadback && state.vocabularyWrites.length) return route.fulfill({ status: 503, json: { message: "Read-back failed" } });
      return json(state.vocabulary.filter(word => path.includes(word.storyPageTemplateId)));
    }
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

test("vocabulary mapper prefers wordVi, allows legacy word only when absent, and rejects a malformed new field", () => {
  const base = { id: "vocab-1", storyPageTemplateId: pageId, meaning: "Nghĩa", audioUrl: "" };
  expect(mapVocabularyDto({ ...base, wordVi: "Nảy mầm" }, pageId)).toMatchObject({ id: "vocab-1", pageId, word: "Nảy mầm", meaning: "Nghĩa" });
  expect(mapVocabularyDto({ ...base, word: "Từ cũ" }, pageId).word).toBe("Từ cũ");
  expect(() => mapVocabularyDto({ ...base, wordVi: 12, word: "Fallback không hợp lệ" }, pageId)).toThrow();
  expect(mapVocabularyDto({ ...base, wordVi: null, word: "Không được fallback" }, pageId).word).toBe("");
  expect(mapVocabularyDto({ ...base, wordVi: "", meaning: null }, pageId)).toMatchObject({ word: "", meaning: "" });
});

test("RawText vocabulary matching uses NFC, ignores case, keeps accents, and uses substring matching", () => {
  expect(vocabularyAppearsInRawText("cây", "CA\u0302Y xanh")).toBe(true);
  expect(vocabularyAppearsInRawText("ÁNH SÁNG", "ánh sáng dịu")).toBe(true);
  expect(vocabularyAppearsInRawText("sang", "sáng dịu")).toBe(false);
  expect(vocabularyAppearsInRawText("sáng", "trong ánh sáng dịu")).toBe(true);
  expect(vocabularyAppearsInRawText("từ", "")).toBe(false);
});

test("Content Manager displays wordVi and create/update send wordVi with matching read-back", async ({ page }) => {
  const state = await setup(page);
  state.pages[0].rawText = "Cây nảy mầm, rồi thành cây non.";
  state.vocabulary = [{ id: "vocabulary-existing", storyPageTemplateId: pageId, wordVi: "Nảy mầm", meaning: "Hạt bắt đầu mọc.", audioUrl: "https://media.example.test/vocabulary.mp3" }];
  const result = await page.evaluate(async ({ storyId, pageId }) => {
    const { contentService } = await import("/src/features/content/services/contentService.js");
    const first = await contentService.getEditor({ storyId });
    const created = await contentService.addVocabulary({ storyId, pageId, word: "cây", meaning: "Một loài thực vật.", audioUrl: "https://media.example.test/tree.mp3" });
    const createdItem = created.vocabulary.find((item) => item.id === "vocabulary-1");
    const updated = await contentService.updateVocabulary({ storyId, vocabularyId: "vocabulary-existing", pageId, word: "Nảy mầm", meaning: "Hạt bắt đầu mọc thành cây.", audioUrl: "https://media.example.test/vocabulary-updated.mp3" });
    return {
      first: first.vocabulary[0],
      created: createdItem,
      updated: updated.vocabulary.find((item) => item.id === "vocabulary-existing"),
    };
  }, { storyId, pageId });
  expect(result.first).toMatchObject({ id: "vocabulary-existing", pageId, word: "Nảy mầm", meaning: "Hạt bắt đầu mọc.", audioUrl: "https://media.example.test/vocabulary.mp3" });
  expect(result.created).toMatchObject({ id: "vocabulary-1", pageId, word: "cây", meaning: "Một loài thực vật.", audioUrl: "https://media.example.test/tree.mp3" });
  expect(result.updated).toMatchObject({ id: "vocabulary-existing", pageId, word: "Nảy mầm", meaning: "Hạt bắt đầu mọc thành cây.", audioUrl: "https://media.example.test/vocabulary-updated.mp3" });
  expect(state.vocabularyWrites).toHaveLength(2);
  expect(state.vocabularyWrites.map(({ method, body }) => ({ method, body }))).toEqual([
    { method: "POST", body: { wordVi: "cây", meaning: "Một loài thực vật.", audioUrl: "https://media.example.test/tree.mp3" } },
    { method: "PUT", body: { wordVi: "Nảy mầm", meaning: "Hạt bắt đầu mọc thành cây.", audioUrl: "https://media.example.test/vocabulary-updated.mp3" } },
  ]);
  expect(state.vocabularyWrites.every(({ body }) => !Object.hasOwn(body, "word"))).toBe(true);
});

test("Content Manager vocabulary editor renders the wordVi response", async ({ page }) => {
  const state = await setup(page);
  state.vocabulary = [{ id: "vocabulary-existing", storyPageTemplateId: pageId, wordVi: "Nảy mầm", meaning: "Hạt bắt đầu mọc.", audioUrl: "" }];
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "cm@test.invalid", password: "intercept" }));
  await page.goto(`/content/stories/${storyId}/vocabulary`);
  await expect(page.getByRole("heading", { name: "Nảy mầm", exact: true })).toBeVisible();
  await expect(page.getByText("Hạt bắt đầu mọc.", { exact: true })).toBeVisible();
});

test("meaning/audio-only update does not apply create RawText validation", async ({ page }) => {
  const state = await setup(page);
  state.pages[0].rawText = "";
  state.vocabulary = [{ id: "vocabulary-existing", storyPageTemplateId: pageId, wordVi: "Từ vẫn giữ", meaning: "Nghĩa cũ.", audioUrl: "" }];
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "cm@test.invalid", password: "intercept" }));
  await page.goto(`/content/stories/${storyId}/vocabulary`);
  await page.getByRole("button", { name: "Sửa từ Từ vẫn giữ" }).click();
  await page.getByLabel("Nghĩa").fill("Nghĩa đã đổi.");
  await page.getByLabel("Đường dẫn âm thanh (không bắt buộc)").fill("https://media.example.test/word.mp3");
  await page.getByLabel("Từ / cụm từ").fill("Từ mới");
  await page.getByRole("button", { name: "Lưu từ", exact: true }).click();
  await expect(page.getByText(/Trang chưa có RawText đã lưu/)).toBeVisible();
  await expect(page.getByLabel("Từ / cụm từ")).toHaveValue("Từ mới");
  expect(state.vocabularyWrites).toHaveLength(0);

  await page.getByLabel("Từ / cụm từ").fill("Từ vẫn giữ");
  await page.getByRole("button", { name: "Lưu từ", exact: true }).click();
  await expect(page.getByText("Nghĩa đã đổi.", { exact: true })).toBeVisible();
  expect(state.paths.filter((path) => path === `GET /api/storypage-template/page/${pageId}`)).toHaveLength(1);
  expect(state.vocabularyWrites).toEqual([{
    method: "PUT",
    path: "/api/story-vocabulary/vocabulary-existing",
    body: { wordVi: "Từ vẫn giữ", meaning: "Nghĩa đã đổi.", audioUrl: "https://media.example.test/word.mp3" },
  }]);
});

test("accepted vocabulary POST with failed GET read-back does not repeat the create", async ({ page }) => {
  const state = await setup(page);
  state.pages[0].rawText = "cây xanh";
  state.failVocabularyReadback = true;
  const result = await page.evaluate(async ({ storyId, pageId }) => {
    const { contentService } = await import("/src/features/content/services/contentService.js");
    try {
      await contentService.addVocabulary({ storyId, pageId, word: "cây", meaning: "Thực vật.", audioUrl: "" });
      return { success: true };
    } catch (error) {
      return { code: error.code, accepted: Boolean(error.mutationAccepted) };
    }
  }, { storyId, pageId });
  expect(result).toMatchObject({ code: "CONTENT_MUTATION_REFRESH_FAILED", accepted: true });
  expect(state.vocabularyWrites.filter(({ method }) => method === "POST")).toHaveLength(1);
  expect(state.vocabulary).toHaveLength(1);
});

test("vocabulary editor checks saved RawText, keeps input on empty server text, and accepts NFC/case variation", async ({ page }) => {
  const state = await setup(page);
  state.pages[0].rawText = "";
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "cm@test.invalid", password: "intercept" }));
  await page.evaluate(async ({ storyId, pageId }) => {
    const { saveMockPageDraft } = await import("/src/features/content/services/contentMockOverlay.js");
    saveMockPageDraft("cm-test", storyId, pageId, { text: "cây nảy mầm chỉ có trong bản nháp" });
  }, { storyId, pageId });
  await page.goto(`/content/stories/${storyId}/vocabulary`);
  await expect(page.getByText("Bản nháp chưa lưu ở Dựng truyện không được tính", { exact: false })).toBeVisible();
  await page.getByLabel("Từ / cụm từ").fill("cây nảy mầm");
  await page.getByLabel("Nghĩa").fill("Một loài thực vật.");
  await page.getByRole("button", { name: "Thêm từ", exact: true }).click();
  await expect(page.getByText(/Trang chưa có RawText đã lưu/)).toBeVisible();
  await expect(page.getByLabel("Từ / cụm từ")).toHaveValue("cây nảy mầm");
  expect(state.vocabularyWrites).toHaveLength(0);

  state.pages[0].rawText = "Cây xanh";
  await page.getByRole("button", { name: "Thêm từ", exact: true }).click();
  await expect(page.getByText(/Từ chưa xuất hiện trong RawText đã lưu/)).toBeVisible();
  expect(state.vocabularyWrites).toHaveLength(0);

  state.pages[0].rawText = "CA\u0302Y NA\u0309Y MA\u0302\u0300M xanh";
  await page.getByRole("button", { name: "Thêm từ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "cây nảy mầm", exact: true })).toBeVisible();
  expect(state.vocabularyWrites).toHaveLength(1);
  expect(state.vocabularyWrites[0].body.wordVi).toBe("cây nảy mầm");
  expect(Object.hasOwn(state.vocabularyWrites[0].body, "word")).toBe(false);
});

test("Backend RawText validation error stays on the word field and keeps the vocabulary draft", async ({ page }) => {
  const state = await setup(page);
  state.pages[0].rawText = "Nảy mầm rồi thành cây xanh.";
  state.rejectVocabularyPost = true;
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "cm@test.invalid", password: "intercept" }));
  await page.goto(`/content/stories/${storyId}/vocabulary`);
  await page.getByLabel("Từ / cụm từ").fill("nảy mầm");
  await page.getByLabel("Nghĩa").fill("Hạt bắt đầu mọc.");
  await page.getByRole("button", { name: "Thêm từ", exact: true }).click();
  await expect(page.getByText("Từ vựng phải xuất hiện trong RawText của trang truyện.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Từ / cụm từ")).toHaveValue("nảy mầm");
  await expect(page.getByLabel("Nghĩa")).toHaveValue("Hạt bắt đầu mọc.");
  expect(state.vocabularyWrites).toHaveLength(1);
  expect(state.vocabulary).toHaveLength(0);
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

test("Draft story cascade is read back before a clean Parent reads its pages, slots and quiz", async ({ page, browser }) => {
  const state = await setup(page);
  const secondPageId = "33333333-3333-3333-3333-333333333333";
  const roleId = "44444444-4444-4444-4444-444444444444";
  const firstSlotId = "55555555-5555-5555-5555-555555555555";
  const secondSlotId = "66666666-6666-6666-6666-666666666666";
  const quizId = "77777777-7777-7777-7777-777777777777";
  state.pages.push({ ...state.pages[0], id: secondPageId, pageNumber: 2, rawText: "Second page", compositionJson: JSON.stringify({ ...composition(), quizExtensions: { [quizId]: { feedback: "Well done" } } }) });
  state.roles = [{ id: roleId, storyTemplateId: storyId, roleName: "Rabbit", defaultAssetUrl: "https://media.example.test/rabbit.png", status: 0 }];
  state.slots = [
    { id: firstSlotId, storyPageId: pageId, storyRoleTemplateId: roleId, posX: 35, posY: 70, scale: 1, status: 0 },
    { id: secondSlotId, storyPageId: secondPageId, storyRoleTemplateId: roleId, posX: 65, posY: 70, scale: 1, status: 0 },
  ];
  state.quizzes = [{ id: quizId, storyTemplateId: storyId, questionText: "Is the rabbit kind?", options: ["Yes", "No"], correctOptionIndex: 0, status: 0 }];
  state.pages[0].compositionJson = JSON.stringify({ ...composition(), slotExtensions: { [firstSlotId]: { rotation: 0, layer: 1, anchor: "center" } } });
  state.pages[1].compositionJson = JSON.stringify({ ...composition(), slotExtensions: { [secondSlotId]: { rotation: 0, layer: 1, anchor: "center" } }, quizExtensions: { [quizId]: { feedback: "Well done" } } });
  expect([state.story.status, ...state.pages.map(row => row.status), ...state.roles.map(row => row.status), ...state.slots.map(row => row.status), ...state.quizzes.map(row => row.status)]).toEqual([0, 0, 0, 0, 0, 0, 0]);
  const published = await page.evaluate(async storyId => {
    try { return { story: await (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }) }; }
    catch (error) { return { code: error.code, message: error.message, accepted: Boolean(error.mutationAccepted) }; }
  }, storyId);
  expect(published.story?.status, `${published.code || ""}: ${published.message || ""}`).toBe("published");
  expect(state.publishCalls).toBe(1);
  expect([state.story.status, ...state.pages.map(row => row.status), ...state.roles.map(row => row.status), ...state.slots.map(row => row.status), ...state.quizzes.map(row => row.status)]).toEqual([2, 2, 2, 2, 2, 2, 2]);
  expect(published.story.publicationState).toMatchObject({ pages: [{ status: 2 }, { status: 2 }], roles: [{ status: 2 }], slots: [{ status: 2 }, { status: 2 }], quizzes: [{ status: 2 }] });
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const reader = await context.newPage();
  try {
    state.paths = [];
    await setup(reader, state, "Parent");
    expect(await reader.evaluate(() => localStorage.length)).toBe(0);
    const result = await reader.evaluate(async storyId => {
      await (await import("/src/features/auth/authService.js")).authService.login({ email: "parent@test.invalid", password: "intercept" });
      const { parentCatalogService } = await import("/src/features/parent/services/parentCatalogService.js");
      const catalog = await parentCatalogService.list();
      const story = await parentCatalogService.get({ storyId });
      const quizzes = await (await import("/src/features/parent/services/parentReaderActivities.js")).getReaderQuizzes({ story });
      return { catalog, story, quizzes };
    }, storyId);
    expect(result.catalog.items.map(item => item.id)).toContain(storyId);
    expect(result.story.pages.map(p => p.text)).toEqual(["Before", "Second page"]);
    expect(result.story.pages.map(p => p.pageNumber)).toEqual([1, 2]);
    expect(result.story.roles[0].slots.map(slot => slot.id)).toEqual([firstSlotId, secondSlotId]);
    expect(result.quizzes).toMatchObject([{ id: quizId, pageId: secondPageId }]);
    expect(result.story.pages[0].compositionJson).toBe(state.pages[0].compositionJson);
    expect(state.paths.some(p => /all-pages|all-roles|all-quizzes/.test(p))).toBe(false);
  } finally { await context.close(); }
});

test("Parent reader filters Draft pages returned by its reader route without using authoring endpoints", async ({ page }) => {
  const state = await setup(page, undefined, "Parent");
  state.story.status = 2;
  state.pages[0].status = 2;
  state.pages.push({ ...state.pages[0], id: "33333333-3333-3333-3333-333333333333", pageNumber: 2, rawText: "Must stay Draft", status: 0 });
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "parent@test.invalid", password: "intercept" }));
  const story = await page.evaluate(async storyId => (await import("/src/features/parent/services/parentCatalogService.js")).parentCatalogService.get({ storyId }), storyId);
  expect(story.pages.map(item => item.text)).toEqual(["Before"]);
  expect(state.paths).toContain(`GET /api/storypage-template/pages/${storyId}`);
  expect(state.paths.some(path => /all-pages|all-roles|all-quizzes/.test(path))).toBe(false);
});

test("publish accepted with failed editor read-back can reconcile by GET without another POST", async ({ page }) => {
  const state = await setup(page);
  state.failPublishReadback = true;
  const result = await page.evaluate(async storyId => {
    try { return { story: await (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }) }; }
    catch (error) { return { code: error.code, accepted: Boolean(error.mutationAccepted) }; }
  }, storyId);
  expect(result).toMatchObject({ code: "CONTENT_MUTATION_REFRESH_FAILED", accepted: true });
  expect(state.publishCalls).toBe(1);
  state.failPublishReadback = false;
  const reconciled = await page.evaluate(async storyId => (await import("/src/features/content/services/contentService.js")).contentService.previewStory({ storyId }), storyId);
  expect(reconciled.status).toBe("published");
  expect(reconciled.pages[0].status).toBe(2);
  expect(state.publishCalls).toBe(1);
});

test("publish timeout stays unknown and does not retry the mutation", async ({ page }) => {
  const state = await setup(page);
  state.failPublishUnknown = true;
  const result = await page.evaluate(async storyId => {
    try { await (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }); }
    catch (error) { return { code: error.code, unknown: Boolean(error.mutationOutcomeUnknown) }; }
  }, storyId);
  expect(result).toMatchObject({ code: "CONTENT_MUTATION_OUTCOME_UNKNOWN", unknown: true });
  expect(state.publishCalls).toBe(1);
  expect(state.story.status).toBe(0);
});

test("publish rejection preserves Draft story and its server content", async ({ page }) => {
  const state = await setup(page);
  state.rejectPublish = true;
  const result = await page.evaluate(async storyId => {
    try { await (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }); }
    catch (error) { return { status: error.status, accepted: Boolean(error.mutationAccepted) }; }
  }, storyId);
  expect(result).toMatchObject({ status: 400, accepted: false });
  expect(state.story.status).toBe(0);
  expect(state.pages[0].status).toBe(0);
  expect(state.publishCalls).toBe(1);
});

test("Pending or Archived story can publish when required components are Draft or Active", async ({ page }) => {
  const state = await setup(page);
  const service = "/src/features/content/services/contentService.js";
  for (const status of [1, 4]) {
    state.story.status = status;
    const storyResult = await page.evaluate(async storyId => {
      try { return { story: await (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }) }; }
      catch (error) { return { code: error.code }; }
    }, storyId);
    expect(storyResult.story?.status, `${service} did not publish parent status ${status}`).toBe("published");
    expect(state.publishCalls).toBe(1);
    expect(state.story.status).toBe(2);
    state.story.status = 0;
    for (const collection of ["pages", "roles", "slots", "quizzes"]) for (const row of state[collection]) row.status = 0;
    state.publishCalls = 0;
  }
  for (const collection of ["pages", "roles", "slots", "quizzes"]) {
    const row = collection === "pages"
      ? { ...state.pages[0], id: `${collection}-pending`, status: 1 }
      : collection === "roles"
        ? { id: "role-pending", storyTemplateId: storyId, roleName: "Pending role", status: 1 }
        : collection === "slots"
          ? { id: "slot-pending", storyPageId: pageId, storyRoleTemplateId: "role-for-pending-slot", posX: 50, posY: 50, scale: 1, status: 1 }
          : { id: "quiz-pending", storyTemplateId: storyId, questionText: "Question", options: ["A", "B"], correctOptionIndex: 0, status: 1 };
    if (collection === "slots") state.roles.push({ id: "role-for-pending-slot", storyTemplateId: storyId, roleName: "Slot role", status: 0 });
    state[collection].push(row);
    const result = await page.evaluate(async storyId => {
      try { await (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }); return { accepted: true }; }
      catch (error) { return { code: error.code }; }
    }, storyId);
    expect(result.code, `${service} rejected ${collection}`).toBe("CONTENT_PUBLISH_INVALID");
    expect(state.publishCalls).toBe(0);
    state[collection].pop();
    if (collection === "slots") state.roles.pop();
  }
});

test("Content Manager can publish a Pending story when its child content is Draft", async ({ page }) => {
  const state = await setup(page);
  state.story.status = 1;
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "cm@test.invalid", password: "intercept" }));
  await page.goto(`/content/stories/${storyId}/pages`);
  const publish = page.getByRole("button", { name: "Xuất bản", exact: true });
  await expect(publish).toBeEnabled();
  await publish.click();
  const dialog = page.getByRole("alertdialog", { name: "Xuất bản truyện?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect.poll(() => state.publishCalls).toBe(1);
  await expect.poll(() => state.story.status).toBe(2);
  await expect(page.getByRole("status").filter({ hasText: /Đã xuất bản truyện/ }).last()).toBeVisible();
});

test("cover is required before publish POST", async ({ page }) => {
  const state = await setup(page);
  state.story.coverImageUrl = "";
  const result = await page.evaluate(async storyId => {
    try { await (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }); }
    catch (error) { return { code: error.code, message: error.message }; }
  }, storyId);
  expect(result.code).toBe("CONTENT_PUBLISH_INVALID");
  expect(result.message).toContain("Ảnh bìa");
  expect(state.publishCalls).toBe(0);
});

test("accepted publish with non-Active child read-back is blocked from success and never reposted", async ({ page }) => {
  const state = await setup(page);
  state.pages.push({ ...state.pages[0], id: "33333333-3333-3333-3333-333333333333", pageNumber: 2, rawText: "Second page" });
  state.skipCascade = "pages";
  const result = await page.evaluate(async storyId => {
    try { await (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }); return { success: true }; }
    catch (error) { return { code: error.code, accepted: Boolean(error.mutationAccepted) }; }
  }, storyId);
  expect(result).toMatchObject({ code: "CONTENT_PUBLISH_READBACK_INCOMPLETE", accepted: true });
  expect(state.story.status).toBe(2);
  expect(state.pages.every(row => row.status === 0)).toBe(true);
  expect(state.publishCalls).toBe(1);
});

test("zero newly published counts still succeeds when server read-back is Active", async ({ page }) => {
  const state = await setup(page);
  state.story.status = 2;
  state.pages[0].status = 2;
  const result = await page.evaluate(async storyId => (await import("/src/features/content/services/contentService.js")).contentService.publishStory({ storyId }), storyId);
  expect(result.status).toBe("published");
  expect(state.publishResult).toMatchObject({ publishedPagesCount: 0, publishedRolesCount: 0, publishedSlotsCount: 0, publishedQuizzesCount: 0 });
});

test("edit made while publish confirmation is open blocks POST and keeps the edit", async ({ page }) => {
  const state = await setup(page);
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "cm@test.invalid", password: "intercept" }));
  await page.goto(`/content/stories/${storyId}/pages`);
  await page.getByRole("button", { name: "Phụ đề", exact: true }).click();
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: "Xuất bản truyện?" });
  await expect(dialog).toBeVisible();
  await page.evaluate(() => {
    const input = [...document.querySelectorAll("textarea")].find(element => element.labels?.[0]?.textContent?.includes("Nội dung truyện"));
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    setter.call(input, "Unsaved during confirmation");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const text = page.getByLabel("Nội dung truyện", { exact: true });
  await expect(text).toHaveValue("Unsaved during confirmation");
  await dialog.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(page.getByText(/Chưa gửi lệnh xuất bản/).last()).toBeVisible();
  await expect(text).toHaveValue("Unsaved during confirmation");
  expect(state.publishCalls).toBe(0);
});

test("one click cannot create overlapping publish confirmations or duplicate POSTs", async ({ page }) => {
  const state = await setup(page);
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "cm@test.invalid", password: "intercept" }));
  await page.goto(`/content/stories/${storyId}/pages`);
  const publish = page.getByRole("button", { name: "Xuất bản", exact: true }).first();
  await publish.click();
  await page.getByRole("button", { name: "Xuất bản", exact: true }).first().evaluate(button => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  const dialog = page.getByRole("alertdialog", { name: "Xuất bản truyện?" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("alertdialog")).toHaveCount(1);
  await dialog.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect.poll(() => state.publishCalls).toBe(1);
  expect(state.writes.filter(write => write === "publish")).toHaveLength(1);
});

test("publish button stays blocked while page narration upload is pending", async ({ page }) => {
  const state = await setup(page);
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "cm@test.invalid", password: "intercept" }));
  await page.goto(`/content/stories/${storyId}/pages`);
  await page.getByRole("button", { name: "Âm thanh", exact: true }).click();
  let release;
  state.delay = new Promise(resolve => { release = resolve; });
  await page.locator(".story-audio-upload input[type=file]").setInputFiles({ name: "narration.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("audio") });
  await expect.poll(() => state.writes.length).toBe(1);
  await expect(page.getByRole("button", { name: "Xuất bản", exact: true })).toBeDisabled();
  expect(state.publishCalls).toBe(0);
  const pageReadCount = state.paths.filter(path => path === `GET /api/storypage-template/page/${pageId}`).length;
  release();
  await expect.poll(() => state.paths.filter(path => path === `GET /api/storypage-template/page/${pageId}`).length).toBe(pageReadCount + 1);
});

test("reader places vocabulary and practice quizzes without exposing feedback before answering or writing logs", async ({ page }) => {
  const state = await setup(page, undefined, "Parent");
  state.story.status = 2; state.pages[0].status = 2;
  state.pages[0].compositionJson = JSON.stringify({ ...composition(), quizExtensions: { question: { feedback: "Rất tốt cho cây." } } });
  state.pages.push({ ...state.pages[0], id: "33333333-3333-3333-3333-333333333333", pageNumber: 2, compositionJson: JSON.stringify(composition()) });
  state.vocabulary = [{ id: "word", storyPageTemplateId: pageId, wordVi: "Nảy mầm", meaning: "Hạt bắt đầu mọc cây.", audioUrl: "https://media.example.test/nay-mam.mp3" }];
  state.quizzes = [{ id: "question", storyTemplateId: storyId, status: 2, questionText: "Cây cần nước không?", options: ["Có", "Không"], correctOptionIndex: 0 }, { id: "ending", storyTemplateId: storyId, status: 2, questionText: "Câu hỏi cuối truyện", options: ["A", "B"], correctOptionIndex: 1 }];
  await page.evaluate(async () => (await import("/src/features/auth/authService.js")).authService.login({ email: "parent@test.invalid", password: "intercept" }));
  await page.goto(`/parent/library/${storyId}/read`);
  await expect(page.getByText("Nảy mầm", { exact: true })).toBeVisible();
  await expect(page.getByText("Hạt bắt đầu mọc cây.", { exact: true })).toBeVisible();
  await expect(page.locator('audio[aria-label="Nghe từ Nảy mầm"]')).toHaveAttribute("src", "https://media.example.test/nay-mam.mp3");
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
