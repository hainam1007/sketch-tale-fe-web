import { test, expect } from "@playwright/test";

test.setTimeout(60_000);

test("create and publish a story through the local editor flow", async ({ page }) => {
  await page.goto("/auth/login");
  await page.locator("#auth-email").fill("content@example.com");
  await page.locator("#auth-password").fill("content123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content$/);

  await page.goto("/content/stories/new");
  await page.locator("#story-title").fill("Khu vườn sau mưa");
  await page.locator("#story-description").fill("Một chuyến khám phá những mầm cây mới.");
  await page.locator("#story-category").selectOption({ label: "Thiên nhiên" });
  await page.locator(".content-story-form button[type=submit]").click();
  await expect(page).toHaveURL(/\/content\/stories\/story-[^/]+\/pages$/);
  const storyId = new URL(page.url()).pathname.split("/stories/")[1].split("/")[0];
  const storyPath = "/content/stories/" + storyId;

  await page.goto(storyPath + "/pages");
  await page.getByRole("button", { name: "Tạo trang đầu tiên" }).click();
  await page.getByLabel("Tên trang").fill("Mầm cây thức giấc");
  await page.getByLabel("Nội dung truyện").fill("Một chiếc lá nhỏ khẽ mở ra sau cơn mưa.");
  await page.locator(".story-studio-topbar-actions button").nth(2).click();
  await expect(page.locator(".story-studio-topbar-actions button").nth(2)).toBeDisabled();
  await expect(page.locator(".story-filmstrip")).toContainText("Mầm cây thức giấc");

  await page.locator(".story-filmstrip-add").click();
  await expect(page.locator(".story-filmstrip > button")).toHaveCount(3);
  await page.getByRole("button", { name: "Đưa trang trước" }).click();
  await expect(page.locator(".story-pages-canvas-toolbar")).toContainText("Trang 1");
  await page.getByRole("button", { name: "Đưa trang sau" }).click();
  await expect(page.locator(".story-pages-canvas-toolbar")).toContainText("Trang 2");
  await page.getByRole("button", { name: "Đưa trang trước" }).click();
  await expect(page.locator(".story-pages-canvas-toolbar")).toContainText("Trang 1");
  await page.getByRole("button", { name: "Xóa trang hiện tại" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("0 từ vựng");
  await page.getByRole("alertdialog").getByRole("button", { name: "Xóa trang" }).click();
  await expect(page.locator(".story-filmstrip > button")).toHaveCount(2);

  await page.goto(storyPath + "/roles");
  await page.getByLabel("Tên nhân vật").fill("Mèo Mây");
  await page.getByRole("button", { name: "Thêm nhân vật", exact: true }).click();
  const roleCard = page.locator(".role-card").filter({ has: page.getByRole("heading", { name: "Mèo Mây" }) });
  await expect(roleCard).toBeVisible();
  await roleCard.locator(".slot-form select").selectOption({ index: 1 });
  await roleCard.locator(".slot-form button[type=submit]").click();
  await expect(roleCard.locator(".slot-row")).toHaveCount(1);

  await page.goto(storyPath + "/vocabulary");
  await page.locator("#story-editor-vocabulary-word").fill("chồi non");
  await page.locator("#story-editor-vocabulary-meaning").fill("Mầm cây mới bắt đầu mọc.");
  await page.locator(".editor-form-card button.workspace-button").click();
  await expect(page.locator(".vocabulary-item")).toContainText("chồi non");

  await page.goto(storyPath + "/quizzes");
  await page.locator("#story-editor-quiz-question").fill("Mầm cây xuất hiện khi nào?");
  await page.locator("#story-editor-quiz-option-0").fill("Sau cơn mưa");
  await page.locator("#story-editor-quiz-option-1").fill("Giữa mùa đông");
  await page.locator("#story-editor-quiz-option-2").fill("Trước khi trồng");
  await page.locator(".quiz-option-field input[type=radio]").first().check();
  await page.locator(".quiz-form-actions button").first().click();
  await expect(page.locator(".quiz-item")).toContainText("Mầm cây xuất hiện khi nào?");

  await page.goto(storyPath + "/preview");
  await expect(page.locator(".story-preview-layout")).toBeVisible();
  await expect(page.locator(".story-preview-learning")).toContainText("chồi non");
  await expect(page.locator(".story-preview-learning")).toContainText("Mầm cây xuất hiện khi nào?");

  await page.locator(".story-editor-actions button").first().click();
  await expect(page.locator(".story-action-success")).toContainText("vượt qua kiểm tra");
  await page.locator(".story-editor-actions button").nth(1).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Xuất bản" }).click();
  await expect(page.locator(".story-editor-title-row")).toContainText("Đã xuất bản");

  await page.goto(storyPath + "/pages");
  await page.getByRole("button", { name: "Xóa trang hiện tại" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("1 từ vựng");
  await expect(page.getByRole("alertdialog")).toContainText("1 câu hỏi");
  await page.getByRole("alertdialog").getByRole("button", { name: "Xóa trang" }).click();
  await expect(page.locator(".story-studio-canvas .editor-empty")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo trang đầu tiên" })).toBeFocused();
  await page.goto(storyPath + "/roles");
  await expect(page.locator(".role-card .slot-row")).toHaveCount(0);
  await page.goto(storyPath + "/vocabulary");
  await expect(page.locator(".vocabulary-item")).toHaveCount(0);
  await page.goto(storyPath + "/quizzes");
  await expect(page.locator(".quiz-item")).toHaveCount(0);
});
