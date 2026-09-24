import { test, expect } from "@playwright/test";

async function loginAsContent(page) {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);
}

test("Content Manager can build a story draft across G3 tabs and publish a version", async ({ page }) => {
  await loginAsContent(page);
  await page.goto("/content/stories/new");
  await page.locator("#story-title").fill("Khu vườn sau cơn mưa");
  await page.locator("#story-description").fill("Một story hoàn chỉnh để kiểm tra luồng editor.");
  await page.locator("#story-category").selectOption({ label: "Thiên nhiên" });
  await page.locator("#story-cover").selectOption("asset-seed-character");
  await page.locator(".content-form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content\/stories\/story-/);

  await page.locator('a[href$="/pages"]').click();
  await page.getByRole("button", { name: "Thêm page" }).click();
  await page.getByLabel("Tiêu đề page").fill("Giọt mưa đầu tiên");
  await page.getByLabel("Nội dung page").fill("Một giọt mưa chạm xuống khu vườn và đánh thức mầm xanh.");
  await page.getByLabel("Narration / voice-over").fill("Một giọt mưa chạm xuống.");
  await page.getByRole("button", { name: "Thêm page" }).click();
  await expect(page.locator(".editor-item h3")).toHaveText("Giọt mưa đầu tiên");

  await page.locator('a[href$="/roles"]').click();
  await page.getByLabel("Tên role").fill("Mầm xanh");
  await page.getByLabel("Default asset").selectOption("asset-seed-character");
  await page.getByRole("button", { name: "Thêm role" }).click();
  await expect(page.locator(".role-card h3")).toHaveText("Mầm xanh");
  await page.getByRole("button", { name: "Thêm slot" }).click();
  await expect(page.locator(".slot-row")).toHaveCount(1);

  await page.locator('a[href$="/vocabulary"]').click();
  await page.getByLabel("Từ / cụm từ").fill("mầm xanh");
  await page.getByLabel("Nghĩa").fill("một cây non đang bắt đầu lớn lên");
  await page.getByRole("button", { name: "Thêm từ" }).click();
  await expect(page.locator(".vocabulary-item h3")).toHaveText("mầm xanh");

  await page.locator('a[href$="/quizzes"]').click();
  await page.getByLabel("Câu hỏi").fill("Điều gì đánh thức khu vườn?");
  await page.getByLabel("Đáp án 1").fill("Một giọt mưa");
  await page.getByLabel("Đáp án 2").fill("Một chiếc lá");
  await page.getByLabel("Đáp án 3").fill("Một ngôi sao");
  await page.getByLabel("Feedback sau khi trả lời").fill("Đúng rồi!");
  await page.getByRole("button", { name: "Thêm quiz" }).click();
  await expect(page.locator(".quiz-item h3")).toHaveText("Điều gì đánh thức khu vườn?");

  await page.locator('a[href$="/preview"]').click();
  await expect(page.locator(".story-preview-stage")).toBeVisible();
  await expect(page.locator(".story-preview-stage-copy h3")).toHaveText("Giọt mưa đầu tiên");

  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(page.locator(".story-action-success")).toContainText("vượt qua");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Publish version" }).click();
  await expect(page.locator(".workspace-badge-success")).toHaveText("Đã publish");
  await expect(page.locator(".story-action-success")).toContainText("publish version");

  await page.locator(".story-editor-tabs a").first().click();
  await page.locator("#story-title").fill("Khu vườn sau cơn mưa · draft mới");
  await page.locator(".content-form button[type=submit]").click();
  await expect(page.locator(".story-draft-chip")).toHaveText("Draft có thay đổi chưa publish");
  await expect(page.locator(".workspace-badge-success")).toHaveText("Đã publish");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Publish version" }).click();
  await expect(page.locator(".story-editor-meta")).toContainText("2 published version");
});

test("Content Manager can preview the seeded story without editing its draft", async ({ page }) => {
  await loginAsContent(page);
  await page.goto("/content/stories/story-first-spark/preview");
  await expect(page.locator(".story-preview-stage")).toBeVisible();
  await expect(page.locator(".story-preview-navigation button")).toHaveCount(2);
  await expect(page.locator(".story-preview-slot")).toHaveCount(1);
  await expect(page.getByText("Draft preview")).toBeVisible();
});
