import { test, expect } from '@playwright/test';
import { subtitleAt } from '../src/features/content/utils/storySubtitles.js';
import { animationDuration } from '../src/features/content/utils/storyAnimation.js';

test.use({ baseURL: process.env.STORY_EDITOR_TEST_URL || 'http://127.0.0.1:5173' });

test('caption boundaries and page duration follow cue timing', () => {
  const page = { text: 'Legacy', subtitles: [{ text: 'First', startMs: 1000, durationMs: 1000 }, { text: 'Second', startMs: 2000, durationMs: 4000 }] };
  expect(subtitleAt(page, 999)).toBe('');
  expect(subtitleAt(page, 1000)).toBe('First');
  expect(subtitleAt(page, 2000)).toBe('Second');
  expect(subtitleAt(page, 6000)).toBe('');
  expect(subtitleAt({ text: 'Legacy' }, 0)).toBe('Legacy');
  expect(subtitleAt({ text: 'Legacy', subtitles: [] }, 0)).toBe('');
  expect(animationDuration(page)).toBe(6000);
});

test('studio edits timed captions, deletes selection, and saves after idle', async ({ page }) => {
  await page.goto('/auth/login');
  await page.locator('#auth-email').fill('content@example.com');
  await page.locator('#auth-password').fill('content123');
  await page.locator('form button[type=submit]').click();
  await expect(page).toHaveURL(/\/content$/);
  await page.goto('/content/stories/story-first-spark/pages');
  await page.getByRole('button', { name: 'Phụ đề', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm phụ đề', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nội dung phụ đề 1', exact: true }).fill('Và chàng trai ấy nói rằng');
  await page.getByLabel('Từ (s)', { exact: true }).fill('1');
  await page.getByLabel('Đến (s)', { exact: true }).fill('2');
  const clip = page.locator('.story-timeline-clip.is-subtitle');
  await expect(clip).toContainText('Và chàng trai ấy nói rằng');
  await page.clock.install();
  await page.clock.runFor(59000);
  await expect(page.getByRole('button', { name: 'Lưu ngay', exact: true })).toBeEnabled();
  await page.mouse.click(10, 10);
  await page.clock.runFor(59000);
  await expect(page.getByRole('button', { name: 'Lưu ngay', exact: true })).toBeEnabled();
  await page.clock.runFor(1500);
  await expect(page.locator('.story-studio-identity [role=status]')).toHaveText('Đã lưu');
  await clip.click();
  await page.keyboard.press('Delete');
  await expect(clip).toHaveCount(0);
  await page.getByRole('button', { name: 'Hoàn tác thay đổi gần nhất' }).click();
  await expect(clip).toHaveCount(1);
  await page.screenshot({ path: 'artifacts/editor-timed-subtitles.png' });
});


test('images transform and delete; audio moves and trims; pages reorder', async ({ page }) => {
  await page.goto('/auth/login');
  await page.locator('#auth-email').fill('content@example.com');
  await page.locator('#auth-password').fill('content123');
  await page.locator('form button[type=submit]').click();
  await expect(page).toHaveURL(/\/content$/);
  await page.goto('/content/stories/story-first-spark/pages');
  await page.getByRole('button', { name: 'Thêm ảnh phụ', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('.asset-picker-dialog-option').first().click();
  await dialog.getByRole('button', { name: 'Chọn tư liệu', exact: true }).click();
  const image = page.locator('.story-canvas-stage-wrap [data-slot-id^="image-"]');
  await expect(image).toBeVisible();
  const bounds = await image.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width / 2 + 50, bounds.y + bounds.height / 2 + 20); await page.mouse.up();
  expect((await image.boundingBox()).x).toBeGreaterThan(bounds.x + 30);
  await page.getByRole('button', { name: 'Lưu ngay', exact: true }).click();
  await expect(page.locator('.story-studio-identity [role=status]')).toHaveText('Đã lưu');
  await page.reload();
  await expect(image).toBeVisible();
  expect((await image.boundingBox()).x).toBeGreaterThan(bounds.x + 30);
  await image.click();
  await page.keyboard.press('Backspace');
  await expect(image).toHaveCount(0);
  await page.getByRole('button', { name: 'Âm thanh', exact: true }).click();
  const wav = Buffer.alloc(16044);
  wav.write('RIFF', 0); wav.writeUInt32LE(16036, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(16000, 40);
  await page.locator('.story-audio-upload input').setInputFiles({ name: 'voice.wav', mimeType: 'audio/wav', buffer: wav });
  const audio = page.locator('.story-timeline-clip.is-audio');
  await expect(audio).toHaveCount(1);
  await audio.click(); await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Bắt đầu (s)', { exact: true })).toHaveValue('0.1');
  const audioBounds = await audio.boundingBox();
  await page.mouse.move(audioBounds.x + audioBounds.width - 3, audioBounds.y + 16);
  await page.mouse.down(); await page.mouse.move(audioBounds.x + audioBounds.width - 33, audioBounds.y + 16); await page.mouse.up();
  await expect(page.getByLabel('Thời lượng (s)', { exact: true })).toHaveValue('0.7');
  await page.keyboard.press('Delete');
  await expect(audio).toHaveCount(0);
  const first = page.locator('.story-filmstrip > button').nth(0);
  const second = page.locator('.story-filmstrip > button').nth(1);
  await first.dragTo(second);
  await expect(page.locator('.story-filmstrip > button.active strong')).toHaveText('Trang 2');
  await page.getByRole('button', { name: 'Lưu ngay', exact: true }).click();
  await expect(page.locator('.story-studio-identity [role=status]')).toHaveText('Đã lưu');
});


test('uploads background and independent image from local files', async ({ page }) => {
  await page.goto('/auth/login');
  await page.locator('#auth-email').fill('content@example.com');
  await page.locator('#auth-password').fill('content123');
  await page.locator('form button[type=submit]').click();
  await expect(page).toHaveURL(/\/content$/);
  await page.goto('/content/stories/story-first-spark/pages');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=', 'base64');
  await page.locator('.story-image-fields input[type=file]').setInputFiles({ name: 'new-background.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('.story-image-fields .asset-picker-gallery-item.selected')).toContainText('new-background.png');
  await page.locator('.story-add-image input[type=file]').setInputFiles({ name: 'new-overlay.png', mimeType: 'image/png', buffer: png });
  const image = page.locator('.story-canvas-stage-wrap [data-slot-id^="image-"]');
  await expect(image).toBeVisible();
  await expect(image.locator('img')).toHaveAttribute('alt', 'new-overlay.png');
  await page.getByRole('button', { name: 'Lưu ngay', exact: true }).click();
  await expect(page.locator('.story-studio-identity [role=status]')).toHaveText('Đã lưu');
  await page.reload();
  await expect(image).toBeVisible();
  await expect(page.locator('.story-image-fields .asset-picker-gallery-item.selected')).toContainText('new-background.png');
  await page.getByRole('button', { name: 'Âm thanh', exact: true }).click();
  await page.screenshot({ path: 'artifacts/editor-audio-panel.png' });
});
