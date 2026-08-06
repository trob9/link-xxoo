import { test, expect, type Page } from "@playwright/test";
import { mintSessionCookie } from "./auth-cookie";
import { runSeedScript } from "./db-path";

/**
 * These assert on *rendered* results — the computed background-image of the
 * profile container, the computed font, the actual border-radius — rather than
 * on the data attributes that drive them. An earlier pass had a passing test
 * for `data-pattern="dots"` while the dots were invisible on every page,
 * because an inline `background` shorthand was wiping the image the stylesheet
 * drew. Asserting on the attribute alone cannot catch that class of bug.
 */
test.describe("theme editor", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context }) => {
    const profile = runSeedScript();
    const cookie = await mintSessionCookie(profile);
    await context.addCookies([cookie]);
  });

  const saveBar = (page: Page) => page.locator("div.fixed.inset-x-0.bottom-0");
  const barVisible = (page: Page) =>
    saveBar(page).evaluate((el) => !el.classList.contains("translate-y-full"));

  /**
   * Clicks an option card by its wrapping label. The radio itself is `sr-only`
   * — visually clipped so the card can be the visible control — which is
   * exactly what a real pointer user clicks, and the only thing Playwright can
   * click without `force`.
   */
  const pickOption = (page: Page, group: string, value: string) =>
    page.locator(`label:has(input[name="${group}"][value="${value}"])`).click();

  test("the save bar stays hidden until something actually changes", async ({
    page,
  }) => {
    await page.goto("/dashboard/theme");
    expect(await barVisible(page)).toBe(false);

    await page.getByRole("button", { name: "Use theme Ink" }).click();
    expect(await barVisible(page)).toBe(true);

    await page.getByRole("button", { name: "Discard" }).click();
    expect(await barVisible(page)).toBe(false);
  });

  test("applying a preset and saving carries its pattern, and the dots really render", async ({
    page,
  }) => {
    await page.goto("/dashboard/theme");

    // Riso's pattern is "dots".
    await page.getByRole("button", { name: "Use theme Riso" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(saveBar(page)).toHaveClass(/translate-y-full/);

    await page.goto("/e2e-tester");
    const profileEl = page.locator("[data-profile]");
    await expect(profileEl).toHaveAttribute("data-pattern", "dots");

    // The attribute is only half the story — this is the half that broke.
    const backgroundImage = await profileEl.evaluate(
      (el) => getComputedStyle(el).backgroundImage,
    );
    expect(backgroundImage).toContain("radial-gradient");
    expect(backgroundImage).not.toBe("none");
  });

  test("every control moves only itself", async ({ page }) => {
    await page.goto("/dashboard/theme");

    // Start from Paper, whose button style is "outline".
    await page.getByRole("button", { name: "Use theme Paper" }).click();
    await expect(page.getByRole("radio", { name: "Outline" })).toBeChecked();

    // Choose a different button style, then change the background. The
    // background control must not drag the button style back.
    await pickOption(page, "buttonStyle", "flat");
    await pickOption(page, "backgroundPattern", "grid");
    await expect(page.getByRole("radio", { name: "Flat" })).toBeChecked();

    // Nor may the font control.
    await pickOption(page, "displayFont", "space-mono");
    await expect(page.getByRole("radio", { name: "Flat" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Grid" })).toBeChecked();
  });

  test("designs, names and re-selects a custom theme", async ({ page }) => {
    await page.goto("/dashboard/theme");
    await expect(page.getByText("Change any colour below")).toBeVisible();

    await page.getByRole("button", { name: "Use theme Ink" }).click();
    await page.getByLabel("Buttons hex colour").fill("#00e5a0");
    await page.getByLabel("Page hex colour").fill("#101014");

    await page.getByRole("button", { name: "Save as new" }).click();
    await page.getByLabel("Theme name").fill("Mint Ink");
    await page.getByRole("button", { name: "Save theme" }).click();

    // It becomes a real, reusable theme.
    await expect(
      page.getByRole("button", { name: "Use theme Mint Ink" }),
    ).toBeVisible();
    await expect(page.getByText("1 saved")).toBeVisible();

    // ...and it is what the public page now looks like.
    await page.goto("/e2e-tester");
    await expect(page.locator("[data-profile]")).toHaveCSS(
      "background-color",
      "rgb(16, 16, 20)",
    );

    // Switching away and back re-selects it intact.
    await page.goto("/dashboard/theme");
    await page.getByRole("button", { name: "Use theme Dawn" }).click();
    await page.getByRole("button", { name: "Use theme Mint Ink" }).click();
    await expect(page.getByLabel("Buttons hex colour")).toHaveValue("#00e5a0");
  });

  test("renames and deletes a saved theme without resetting the live page", async ({
    page,
  }) => {
    await page.goto("/dashboard/theme");
    await page.getByRole("button", { name: "Use theme Citrus" }).click();
    await page.getByRole("button", { name: "Save as new" }).click();
    await page.getByLabel("Theme name").fill("Summer");
    await page.getByRole("button", { name: "Save theme" }).click();
    await expect(
      page.getByRole("button", { name: "Use theme Summer" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Rename" }).click();
    await page.getByRole("textbox", { name: "Theme name" }).fill("Autumn");
    await page.getByRole("button", { name: "OK" }).click();
    await expect(
      page.getByRole("button", { name: "Use theme Autumn" }),
    ).toBeVisible();

    // Deleting the theme unlinks it; the page keeps the look it already had.
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Yes" }).click();
    await expect(
      page.getByRole("button", { name: "Use theme Autumn" }),
    ).toHaveCount(0);

    await page.goto("/e2e-tester");
    await expect(page.locator("[data-profile]")).toHaveCSS(
      "background-color",
      "rgb(255, 243, 214)",
    );
  });

  test("flags an unreadable combination and fixes it on request", async ({
    page,
  }) => {
    await page.goto("/dashboard/theme");

    // Near-white text on a near-white page.
    await page
      .getByLabel("Text hex colour", { exact: true })
      .fill("#f2ece0");
    await expect(page.getByText(/hard to read/)).toBeVisible();

    await page.getByRole("button", { name: "Fix" }).first().click();
    await expect(page.getByText("All text passes WCAG AA")).toBeVisible();
  });

  test("avatar shape is set here and reaches the public page", async ({
    page,
  }) => {
    await page.goto("/dashboard/theme");
    await pickOption(page, "avatarShape", "square");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(saveBar(page)).toHaveClass(/translate-y-full/);

    await page.goto("/e2e-tester");
    // No upload in the seed, so the fallback initial block carries the shape.
    await expect(page.locator("header > div").first()).toHaveCSS(
      "border-radius",
      "0px",
    );
  });

  test("the chosen font applies to the profile name, not just the body", async ({
    page,
  }) => {
    await page.goto("/dashboard/theme");
    await pickOption(page, "displayFont", "space-mono");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(saveBar(page)).toHaveClass(/translate-y-full/);

    await page.goto("/e2e-tester");
    // A global `h1 { font-family: ... }` rule used to beat the inherited
    // theme font, so the name was the one thing the font control missed.
    const heading = page.getByRole("heading", { name: "E2E Tester" });
    const bodyFont = await page
      .locator("[data-profile]")
      .evaluate((el) => getComputedStyle(el).fontFamily);
    await expect(heading).toHaveCSS("font-family", bodyFont);
  });
});
