import { test, expect } from "@playwright/test";
import { mintSessionCookie } from "./auth-cookie";
import { runSeedScript } from "./db-path";

test.describe("analytics", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context }) => {
    const profile = runSeedScript();
    const cookie = await mintSessionCookie(profile);
    await context.addCookies([cookie]);
  });

  test("visiting a public page records a view and a click rate becomes computable", async ({
    page,
  }) => {
    await page.goto("/dashboard/analytics");
    await expect(page.getByText("No views yet")).toBeVisible();

    // Wait on the beacon's own response rather than a fixed delay — it is
    // fire-and-forget from the page's point of view, so there is nothing in
    // the DOM that changes when it lands.
    const recorded = page.waitForResponse(
      (res) => res.url().includes("/view") && res.status() === 204,
    );
    await page.goto("/e2e-tester");
    await recorded;

    await page.goto("/dashboard/analytics");
    await expect(page.getByText("No views yet")).toHaveCount(0);
    // One view, no clicks — a click rate is now computable, which is the
    // whole point of recording views.
    await expect(page.getByText("0%")).toBeVisible();
  });
});
