import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "./helpers";

test.describe("Protected navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("home page opens after authentication", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
  });

  test("profile page opens", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile$/);
  });

  test("caretakers page opens", async ({ page }) => {
    await page.goto("/caretakers");
    await expect(page).toHaveURL(/\/caretakers$/);
  });

  test("pets page opens", async ({ page }) => {
    await page.goto("/pets");
    await expect(page).toHaveURL(/\/pets$/);
  });

  test("chats page opens", async ({ page }) => {
    await page.goto("/chats");
    await expect(page).toHaveURL(/\/chats$/);
  });

  test("settings page opens", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings$/);
  });
});