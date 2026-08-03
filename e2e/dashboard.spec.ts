import { test, expect } from "@playwright/test";
import { mintSessionCookie } from "./auth-cookie";
import { runSeedScript } from "./db-path";

test.describe("authenticated dashboard", () => {
  // Shared sqlite file + seeded profile (migrated once in globalSetup) — keep
  // these tests off separate workers so writes don't race each other.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context }) => {
    const profile = runSeedScript();
    const cookie = await mintSessionCookie(profile);
    await context.addCookies([cookie]);
  });

  test("shows the seeded link and lets you add a new one", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Existing link")).toBeVisible();

    await page.getByRole("button", { name: /add link/i }).click();
    await page.getByLabel("Title").fill("Playwright link");
    await page.getByLabel("URL").fill("https://example.com/playwright");
    await page.getByRole("button", { name: /save link/i }).click();

    await expect(page.getByText("Playwright link")).toBeVisible();
  });

  test("public profile page reflects a newly added link", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /add link/i }).click();
    await page.getByLabel("Title").fill("Public visible link");
    await page.getByLabel("URL").fill("https://example.com/public");
    await page.getByRole("button", { name: /save link/i }).click();
    await expect(page.getByText("Public visible link")).toBeVisible();

    await page.goto("/e2e-tester");
    await expect(page.getByText("Public visible link")).toBeVisible();
  });

  test("theme page lets you switch presets", async ({ page }) => {
    await page.goto("/dashboard/theme");
    await expect(
      page.getByText("Charcoal and acid green, for night owls."),
    ).toBeVisible();
  });

  test("settings page saves profile changes", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.getByLabel("Display name").fill("E2E Tester Updated");
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByLabel("Display name")).toHaveValue(
      "E2E Tester Updated",
    );
  });
});
