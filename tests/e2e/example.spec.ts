import { test, expect } from "@playwright/test";

/**
 * E2E tests require the app to be running.
 * Run: npm run dev
 * Then: npx playwright test
 */

test.describe("Dashboard", () => {
  test("loads dashboard page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });
});
