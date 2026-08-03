// Deliberately free of any Prisma import: the generated Prisma client is ESM
// (uses import.meta.url) and Playwright's config/test loader transforms
// files as CommonJS, which chokes on that. Seeding happens in a separate
// `tsx`-run subprocess (seed-script.ts) instead — see runSeedScript below.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

export const TEST_DB_PATH = path.resolve(__dirname, ".tmp/e2e-test.db");
export const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

const PROJECT_ROOT = path.resolve(__dirname, "..");

export function resetAndMigrateTestDb() {
  mkdirSync(path.dirname(TEST_DB_PATH), { recursive: true });
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = TEST_DB_PATH + suffix;
    if (existsSync(file)) rmSync(file);
  }

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}

export function runSeedScript(): { userId: string; username: string } {
  const output = execFileSync(
    "npx",
    ["tsx", path.join(__dirname, "seed-script.ts")],
    {
      cwd: PROJECT_ROOT,
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      encoding: "utf-8",
    },
  );
  const lastLine = output.trim().split("\n").pop() ?? "{}";
  return JSON.parse(lastLine);
}
