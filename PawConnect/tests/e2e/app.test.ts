import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "./helpers";

test.describe("Core app flows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("profile page shows editable user area", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator("body")).not.toContainText("Свържете се с любители на домашни любимци");
  });

  test("caretakers page renders search/browsing interface", async ({ page }) => {
    await page.goto("/caretakers");
    await expect(page).toHaveURL(/\/caretakers$/);
    await expect(page.locator("body")).not.toContainText("Свържете се с любители на домашни любимци");
  });

  test("pets page renders pet management interface", async ({ page }) => {
    await page.goto("/pets");
    await expect(page).toHaveURL(/\/pets$/);
  });

  test("chats page renders messaging interface", async ({ page }) => {
    await page.goto("/chats");
    await expect(page).toHaveURL(/\/chats$/);
    await expect(page.locator("body")).not.toContainText("Свържете се с любители на домашни любимци");
  });
});