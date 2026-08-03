import { test, expect } from "@playwright/test";

test("landing page renders hero and sign-in CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Everything you make",
  );
  await expect(
    page.getByRole("button", { name: /continue with discord/i }),
  ).toBeVisible();
});

test("login page renders the Discord CTA", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("link.xxoo.ooo")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /continue with discord/i }),
  ).toBeVisible();
});

test("unauthenticated visit to /dashboard redirects to /login", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("unknown profile username returns a not-found page", async ({ page }) => {
  const response = await page.goto("/this-user-does-not-exist-12345");
  expect(response?.status()).toBe(404);
});
