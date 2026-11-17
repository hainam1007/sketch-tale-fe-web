import { test, expect } from '@playwright/test';
test.setTimeout(90_000);

test('collection editors fit narrow screens and focus the item being edited', async ({ page }) => {
  await page.goto('/auth/login');
  await page.locator('#auth-email').fill('content@example.com');
  await page.locator('#auth-password').fill('content123');
  await page.locator('form button[type=submit]').click();
  await expect(page).toHaveURL(/\/content$/);
  for (const [route, field] of [['roles', 'role-name'], ['vocabulary', 'vocabulary-word'], ['quizzes', 'quiz-question']]) {
    await page.goto(`/content/stories/story-first-spark/${route}`);
    const panel = page.locator('.story-collection-editor');
    await expect(panel).toBeVisible();
    for (const width of [1366, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const actions = panel.locator('.editor-item-actions').first();
      if (await actions.count()) {
        await actions.locator('button').first().click();
        await expect(page.locator(`#story-editor-${field}`)).toBeFocused();
        await page.reload();
        await expect(panel).toBeVisible();
      }
      await page.screenshot({ path: `artifacts/collection-${route}-${width}.png`, fullPage: true });
    }
  }
});
