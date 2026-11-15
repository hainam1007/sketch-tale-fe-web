import { test, expect } from "@playwright/test";

test.setTimeout(60_000);

test("local demo survives reload with media bytes and preserves previous snapshot on failed save", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { saveLocalStoryDemo } = await import("/src/features/content/services/localStoryDemo.js");
    const image = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="red"/></svg>');
    const audio = URL.createObjectURL(new Blob(["demo-audio-bytes"], { type: "audio/wav" }));
    const story = {
      id: "local-demo-test", title: "Demo", roles: [], quizzes: [], vocabulary: [],
      pages: [{ id: "p1", text: "Bản chưa lưu API", imageObjects: [{ id: "i1", assetId: "image" }],
        audioTracks: [{ id: "t1", assetId: "audio", startMs: 500, volume: 0.5 }],
        animationClips: [{ id: "c1", kind: "path", targetId: "i1", startMs: 100, durationMs: 2000, points: [{ x: 10, y: 20 }, { x: 80, y: 70 }] }],
        subtitles: [{ id: "s1", text: "Xin chào", startMs: 0, durationMs: 2000 }] }],
    };
    await saveLocalStoryDemo(story, [{ id: "image", kind: "image", url: image }, { id: "audio", kind: "audio", url: audio }], "demo-test-user");
    URL.revokeObjectURL(audio);
    try {
      await saveLocalStoryDemo({ ...story, title: "Failed replacement" }, [], "demo-test-user");
      throw new Error("Expected missing media error");
    } catch (error) {
      if (!error.message.includes("Thiếu tệp")) throw error;
    }
  });
  await page.reload();
  const result = await page.evaluate(async () => {
    const { readLocalStoryDemo } = await import("/src/features/content/services/localStoryDemo.js");
    const saved = await readLocalStoryDemo("local-demo-test", "demo-test-user");
    const audio = saved.localDemo.assets.find((asset) => asset.id === "audio");
    const image = saved.localDemo.assets.find((asset) => asset.id === "image");
    const img = new Image();
    img.src = image.url;
    await img.decode();
    let isolated = false;
    try { await readLocalStoryDemo("local-demo-test", "different-user"); } catch { isolated = true; }
    return { title: saved.title, page: saved.pages[0], audio: await (await fetch(audio.url)).text(), width: img.naturalWidth, isolated };
  });
  expect(result.title).toBe("Demo");
  expect(result.page.animationClips[0].points[1]).toEqual({ x: 80, y: 70 });
  expect(result.page.subtitles[0].text).toBe("Xin chào");
  expect(result.page.audioTracks[0].startMs).toBe(500);
  expect(result.audio).toBe("demo-audio-bytes");
  expect(result.width).toBe(2);
  expect(result.isolated).toBe(true);
});

test("reader opens the saved local story without story or asset API queries", async ({ page }) => {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);
  await page.evaluate(async () => {
    const { saveLocalStoryDemo } = await import("/src/features/content/services/localStoryDemo.js");
    const userId = JSON.parse(localStorage.getItem("sketchtale.session.v1")).userId;
    await saveLocalStoryDemo({ id: "reader-demo", title: "Truyện demo local", roles: [], quizzes: [], vocabulary: [], pages: [{ id: "p1", text: "Nội dung demo trên máy", audioTracks: [], imageObjects: [], animationClips: [] }] }, [], userId);
  });
  await page.goto("/content/stories/reader-demo/preview?localDemo=1");
  await expect(page.getByText("Bản demo lưu trên máy", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Phát trang", exact: true })).toBeVisible();
  await expect(page.getByText("Nội dung demo trên máy", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Phát trang", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Phát trang", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tạm dừng", exact: true })).toBeVisible();
});
