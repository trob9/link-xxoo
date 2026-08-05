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

  test("bare-domain URL gets auto-https-prefixed, and the picked emoji shows on the public page", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /add link/i }).click();
    await page.getByLabel("Title").fill("Icon link");

    const urlInput = page.getByLabel("URL");
    await urlInput.fill("example.com/icon-test");

    // Open the emoji picker and choose one — proves the picker itself
    // writes into the same "icon" field the form submits.
    await page.getByRole("button", { name: "Pick" }).click();
    await page.getByRole("button", { name: "🎵" }).click();

    // Blur-normalization should have already rewritten the URL field.
    await urlInput.blur();
    await expect(urlInput).toHaveValue("https://example.com/icon-test");

    await page.getByRole("button", { name: /save link/i }).click();
    await expect(page.getByText("Icon link")).toBeVisible();

    await page.goto("/e2e-tester");
    const link = page.getByRole("link", { name: /Icon link/ });
    await expect(link).toBeVisible();
    await expect(link).toContainText("🎵");
    await expect(link).toHaveAttribute(
      "href",
      "https://example.com/icon-test",
    );
  });

  test("theme page lets you switch presets", async ({ page }) => {
    await page.goto("/dashboard/theme");
    await expect(
      page.getByText("Charcoal and acid green, for night owls."),
    ).toBeVisible();
  });

  test("URL placeholder updates per platform, and a mismatch is rejected only on submit", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");

    const urlInput = page.getByLabel("URL");
    await page.getByLabel("Platform").selectOption("instagram");
    await expect(urlInput).toHaveAttribute("placeholder", "instagram.com/you");
    // No persistent hint text before any submission is attempted.
    await expect(page.getByText(/must be a link to/i)).toHaveCount(0);

    await page.getByLabel("Platform").selectOption("youtube");
    await expect(urlInput).toHaveAttribute("placeholder", "youtube.com/@you");

    // Wrong platform for this URL — should be rejected, not added, and the
    // mismatch message should only appear now, as a submit error.
    await page.getByLabel("Platform").selectOption("facebook");
    await urlInput.fill("instagram.com/testuser");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(
      page.getByText(/must be a link to facebook\.com/i),
    ).toBeVisible();
    await expect(page.getByText("No social links yet.")).toBeVisible();
  });

  test("accepts a matching social URL and normalizes it to https", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");

    await page.getByLabel("Platform").selectOption("instagram");
    await page.getByLabel("URL").fill("instagram.com/testuser");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(
      page.getByText("https://instagram.com/testuser"),
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

  test("uploads a custom avatar, sets a shape, and it renders on the public page", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");

    await page.setInputFiles(
      'input[type="file"][name="avatar"]',
      "e2e/fixtures/test-avatar.png",
    );
    await expect(page.getByText("New photo selected")).toBeVisible();

    await page.getByRole("button", { name: "Square" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText("Saved")).toBeVisible();
    // The transient preview clears once the real upload is reflected.
    await expect(page.getByText("New photo selected")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Remove photo" }),
    ).toBeVisible();

    // The image was genuinely processed and is served as WebP. The version
    // segment is opaque (cache-buster only), any value works for lookup.
    const res = await page.request.get("/api/avatar/e2e-tester/1");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/webp");

    await page.goto("/e2e-tester");
    const avatarImg = page.locator("header img");
    await expect(avatarImg).toBeVisible();
    await expect(avatarImg).toHaveCSS("border-radius", "0px");
  });

  test("rejects an SVG upload (script tag + SSRF-shaped external reference) even through the real UI", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");

    await page.setInputFiles(
      'input[type="file"][name="avatar"]',
      "e2e/fixtures/malicious.svg",
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText(/unsupported image format/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Remove photo" }),
    ).toHaveCount(0);

    // Nothing was ever stored.
    const res = await page.request.get("/api/avatar/e2e-tester/1");
    expect(res.status()).toBe(404);
  });

  test("turning off the profile picture hides it from the public page", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");

    await page.getByRole("switch", { name: "Show profile picture" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved")).toBeVisible();

    await page.goto("/e2e-tester");
    await expect(page.locator("header img")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "E2E Tester" }),
    ).toBeVisible();
  });
});
