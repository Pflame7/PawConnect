import { expect, test } from "@playwright/test";

test.describe("Public pages", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/auth?mode=login");

    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();

    await expect(
      page.locator("form").getByRole("button", { name: /вход|login/i }),
    ).toBeVisible();
  });

  test("unauthenticated user is redirected when opening protected route", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL(/\/auth/);
    await expect(page).toHaveURL(/\/auth/);
  });
});