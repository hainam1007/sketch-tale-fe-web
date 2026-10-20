import { test, expect } from "@playwright/test";

test("mock editor removes deleted character motion and rejects orphan learning items", async ({ page }) => {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);
  const result = await page.evaluate(async () => {
    const { contentService: api } = await import("/src/features/content/services/contentService.js");
    let story = await api.getEditor({ storyId: "story-first-spark" });
    const storyId = story.id;
    const role = story.roles.find((item) => item.slots.length);
    const slot = role.slots[0];
    const scene = story.pages.find((item) => item.id === slot.pageId);
    story = await api.updatePage({ storyId, pageId: scene.id, revision: story.revision, ...scene,
      sequence: [{ id: "regression-action", slotId: slot.id, type: "appear", startMs: 0, durationMs: 500 }],
      animationClips: [{ id: "regression-clip", targetId: slot.id, kind: "preset", preset: "appear", startMs: 0, durationMs: 500 }],
    });
    const errors = {};
    async function reject(name, operation) {
      try { await operation(); errors[name] = "accepted"; } catch (error) { errors[name] = error.status; }
    }
    await reject("missingRevision", () => api.updatePage({ storyId, pageId: scene.id, ...scene, title: scene.title + " " }));
    await reject("duplicate", () => api.addSlot({ storyId, roleId: role.id, pageId: scene.id, x: 50, y: 50, scale: 1, revision: story.revision }));
    await reject("vocabulary", () => api.addVocabulary({ storyId, pageId: "deleted-page", word: "test", meaning: "test", revision: story.revision }));
    await reject("quiz", () => api.addQuiz({ storyId, pageId: "deleted-page", question: "test?", options: ["A", "B"], correctIndex: 0, revision: story.revision }));
    await reject("stale", () => api.deleteSlot({ storyId, roleId: role.id, slotId: slot.id, revision: story.revision - 1 }));
    story = await api.deleteSlot({ storyId, roleId: role.id, slotId: slot.id, revision: story.revision });
    const updatedPage = story.pages.find((item) => item.id === scene.id);
    const reloaded = await api.getEditor({ storyId });
    return { errors, sequence: updatedPage.sequence, clips: updatedPage.animationClips,
      persistedClips: reloaded.pages.find((item) => item.id === scene.id).animationClips,
      slotPresent: story.roles.some((item) => item.slots.some((item) => item.id === slot.id)) };
  });
  expect(result.errors).toEqual({ missingRevision: 422, duplicate: 422, vocabulary: 422, quiz: 422, stale: 409 });
  expect(result.sequence).toEqual([]);
  expect(result.clips).toEqual([]);
  expect(result.persistedClips).toEqual([]);
  expect(result.slotPresent).toBe(false);
});
