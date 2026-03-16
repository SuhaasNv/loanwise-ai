import { test, expect } from "@playwright/test";

/**
 * E2E tests require the app to be running.
 * Playwright config starts the dev server automatically (webServer).
 * Run: npm run test:e2e
 */

test.describe("Landing page", () => {
  test("loads landing page with LoanWise AI", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByText("LoanWise AI")).toBeVisible();
  });
});
