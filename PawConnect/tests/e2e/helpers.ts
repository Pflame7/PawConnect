import { expect, type Page } from "@playwright/test";

export async function loginAsTestUser(page: Page): Promise<void> {
  const email = process.env.PAWCONNECT_TEST_EMAIL;
  const password = process.env.PAWCONNECT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing PAWCONNECT_TEST_EMAIL or PAWCONNECT_TEST_PASSWORD in .env.e2e",
    );
  }

  await page.goto("/auth?mode=login");

  await expect(page.locator("input[type='email']")).toBeVisible();
  await expect(page.locator("input[type='password']")).toBeVisible();

  await page.locator("input[type='email']").fill(email);
  await page.locator("input[type='password']").fill(password);

  const submitButton = page
    .locator("form")
    .getByRole("button", { name: /вход|login/i });

  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 15000,
  });
}