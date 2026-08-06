import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { TEST_DATABASE_URL } from "./e2e/db-path";

// Overridable because 3000 is a popular port — on a machine already hosting
// something there, `E2E_PORT=3100 npm run test:e2e` gets out of its way.
const PORT = process.env.E2E_PORT ?? "3000";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // One worker, not parallel: every spec shares a single sqlite file and a
  // single seeded profile, and each test reseeds it in beforeEach. Run two
  // spec files at once and one file's reseed lands in the middle of another
  // file's test — which shows up as a test failing on data it never wrote.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
    },
  },
});
