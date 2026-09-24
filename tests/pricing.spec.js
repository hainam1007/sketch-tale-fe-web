import { test, expect } from "@playwright/test";

test("standalone pricing page is removed from the public site", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Trang này đi lạc rồi.",
  );
});
