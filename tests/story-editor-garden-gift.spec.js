import { test, expect } from "@playwright/test";
import { gardenGiftStoryFixture as story, gardenGiftAudio } from "../src/features/content/data/gardenGiftStoryFixture.js";
import { bobbyAssetFixtures } from "../src/features/content/data/bobbyStoryFixture.js";
import { subtitleAt } from "../src/features/content/utils/storySubtitles.js";
import { authoredPageCompanions, applyAuthoredPageCompanion } from "../src/features/content/data/authoredPageCompanions.js";
import { clipsConflict, evaluateSlotAnimation } from "../src/features/content/utils/storyAnimation.js";

test("authored choreography stays in frame without overlapping property tracks or abrupt jumps", () => {
  for (const [index, entry] of Object.values(authoredPageCompanions).entries()) {
    const clips = entry.animationClips;
    const slot = { ...story.roles[0].slots[index], id: clips[0].targetId };
    expect(clips.length).toBeGreaterThanOrEqual(12);
    for (const clip of clips) {
      expect(clipsConflict(clips, clip, clip.id)).toBe(false);
      expect(clip.startMs + clip.durationMs).toBeLessThanOrEqual(57391);
    }
    for (let time = 0; time <= 57391; time += 100) {
      const state = evaluateSlotAnimation(slot, clips, time);
      expect(state.x).toBeGreaterThanOrEqual(30);
      expect(state.x).toBeLessThanOrEqual(82);
      expect(state.y).toBeGreaterThanOrEqual(50);
      expect(state.y).toBeLessThanOrEqual(63);
      expect(state.scale).toBeGreaterThan(0.8);
      expect(state.scale).toBeLessThan(1.15);
    }
    for (const time of clips.flatMap((clip) => [clip.startMs, clip.startMs + clip.durationMs]).filter((time) => time > 0)) {
      const before = evaluateSlotAnimation(slot, clips, time - 1);
      const after = evaluateSlotAnimation(slot, clips, time);
      for (const property of ["x", "y", "rotation", "scale"]) expect(Math.abs(after[property] - before[property])).toBeLessThan(0.1);
    }
  }
});

test("server companion never applies stale captions to edited content or replaced audio", () => {
  const [id, entry] = Object.entries(authoredPageCompanions)[0];
  const page = { id, storyTemplateId: entry.storyId, text: entry.expectedText, audioNarrationUrl: entry.expectedAudioUrl, audioTracks: [{ id: "server-audio" }] };
  const enhanced = applyAuthoredPageCompanion(page);
  expect(enhanced.subtitles).toHaveLength(5);
  expect(enhanced.audioTracks[0].durationMs).toBe(57391);
  expect(enhanced.animationClips[0].targetId).toBe(entry.animationClips[0].targetId);
  enhanced.subtitles[0].text = "Edited";
  expect(applyAuthoredPageCompanion(page).subtitles[0].text).not.toBe("Edited");
  for (const patch of [{ text: "New edition" }, { audioNarrationUrl: "/replacement.mp3" }, { storyTemplateId: "another-story" }, { id: "another-page" }]) {
    const changed = { ...page, ...patch };
    expect(applyAuthoredPageCompanion(changed)).toBe(changed);
    expect(changed.subtitles).toBeUndefined();
  }
});

test("five-page story has complete media, continuous captions and valid character placements", () => {
  const assets = new Set([...bobbyAssetFixtures, gardenGiftAudio].map((asset) => asset.id));
  expect(story.pages).toHaveLength(5);
  for (const page of story.pages) {
    expect(assets.has(page.backgroundAssetId)).toBe(true);
    expect(page.audioTracks[0].assetId).toBe(gardenGiftAudio.id);
    expect(page.audioTracks[0].durationMs).toBe(57391);
    expect(page.subtitles.map((cue) => cue.text).join("\n\n")).toBe(page.text);
    let end = 0;
    for (const cue of page.subtitles) {
      expect(cue.startMs).toBe(end);
      expect(subtitleAt(page, cue.startMs)).toBe(cue.text);
      end = cue.startMs + cue.durationMs;
    }
    expect(end).toBe(57391);
    const slot = story.roles[0].slots.find((item) => item.pageId === page.id);
    expect(assets.has(slot.assetId)).toBe(true);
    expect(page.animationClips[0].targetId).toBe(slot.id);
  }
});

test("garden story loads actual media, edits text with timed captions and survives reload", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);
  await page.goto(`/content/stories/${story.id}/pages`);
  await expect(page.locator(".story-filmstrip > button")).toHaveCount(6);
  // Previously these three Bobby backgrounds were incorrectly excluded from the gallery.
  for (const name of ["Khu vườn trước nhà", "Hành lang ấm áp", "Phòng khách đầy nắng"]) {
    await expect(page.locator(".story-image-fields").getByRole("button", { name, exact: false })).toBeVisible();
  }
  for (let index = 0; index < 5; index++) {
    await page.locator(".story-filmstrip > button").nth(index).click();
    await expect(page.locator(".story-canvas-page-label")).toHaveText(`Trang ${index + 1} / 5`);
    await expect.poll(() => page.locator(".story-canvas-stage-wrap img").evaluateAll((images) => images.length >= 2 && images.every((img) => img.complete && img.naturalWidth > 0))).toBe(true);
    await page.getByRole("button", { name: "Âm thanh", exact: true }).click();
    const audio = page.locator(".story-audio-track audio");
    await expect(audio).toHaveAttribute("src", gardenGiftAudio.url);
    await expect.poll(() => audio.evaluate((element) => element.duration)).toBeCloseTo(57.391, 1);
    await audio.evaluate(async (element) => { await element.play(); });
    await expect.poll(() => audio.evaluate((element) => element.currentTime)).toBeGreaterThan(0);
    await audio.evaluate((element) => element.pause());
    await page.getByRole("button", { name: "Phụ đề", exact: true }).click();
    await expect(page.locator(".story-cue")).toHaveCount(5);
    await expect(page.getByLabel("Nội dung truyện", { exact: true })).toHaveValue(story.pages[index].text);
    await page.getByRole("button", { name: "Phụ đề 2", exact: true }).click();
    await page.screenshot({ path: `artifacts/garden-gift/page-${index + 1}.png` });
  }
  const edited = story.pages[4].text + "\n\nHết truyện.";
  await page.getByLabel("Nội dung truyện", { exact: true }).fill(edited);
  await page.getByRole("button", { name: "Lưu ngay", exact: true }).click();
  await expect(page.locator(".story-studio-identity [role=status]")).toHaveText("Đã lưu");
  await page.reload();
  await page.locator(".story-filmstrip > button").nth(4).click();
  await page.getByRole("button", { name: "Phụ đề", exact: true }).click();
  await expect(page.getByLabel("Nội dung truyện", { exact: true })).toHaveValue(edited);
  await expect(page.locator(".story-cue")).toHaveCount(5);
  if (await page.evaluate(() => Boolean(localStorage.getItem("sketchtale.mock.database.v1")))) {
    const reopened = await page.context().newPage();
    await reopened.goto(`/content/stories/${story.id}/pages`);
    await reopened.locator(".story-filmstrip > button").nth(4).click();
    await reopened.getByRole("button", { name: "Phụ đề", exact: true }).click();
    await expect(reopened.getByLabel("Nội dung truyện", { exact: true })).toHaveValue(edited);
    await reopened.close();
  }
  for (const width of [1366, 768, 390]) {
    await page.setViewportSize({ width, height: 850 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByLabel("Nội dung truyện", { exact: true })).toBeVisible();
    await page.screenshot({ path: `artifacts/garden-gift/editor-${width}.png` });
  }
  await page.setViewportSize({ width: 1366, height: 850 });
  await page.getByRole("button", { name: "Phụ đề 2", exact: true }).click();
  const editorWidth = await page.locator(".story-canvas-stage-wrap [data-slot-id]").evaluate((slot) => slot.style.width);
  await page.goto(`/content/stories/${story.id}/preview`);
  await page.getByRole("button", { name: "Phát trang", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tạm dừng", exact: true })).toBeVisible();
  await expect(page.locator(".story-preview-subtitles")).toContainText(story.pages[0].subtitles[0].text);
  await expect(page.locator(".story-preview-error")).toHaveCount(0);
  await expect.poll(() => page.locator(".story-preview-main [data-slot-id]").evaluate((slot) => slot.style.width)).toBe(editorWidth);
  await page.locator(".story-preview-main .story-preview-stage").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "artifacts/garden-gift/preview.png" });
});
