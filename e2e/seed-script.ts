// Run only via `npx tsx e2e/seed-script.ts` (see db-path.ts#runSeedScript) —
// never imported directly by Playwright's config/test loader, since the
// generated Prisma client below is ESM and tsx is what makes that safe.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { TEST_USER } from "./constants";

async function main() {
  const url = (process.env.DATABASE_URL ?? "").replace(/^file:/, "");
  const adapter = new PrismaBetterSqlite3({ url });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.upsert({
    where: { discordId: TEST_USER.discordId },
    update: {},
    create: { discordId: TEST_USER.discordId },
  });

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      username: TEST_USER.username,
      displayName: TEST_USER.displayName,
      themePreset: "dawn",
    },
  });

  await prisma.link.deleteMany({ where: { profileId: profile.id } });
  await prisma.socialLink.deleteMany({ where: { profileId: profile.id } });
  await prisma.link.create({
    data: {
      profileId: profile.id,
      title: "Existing link",
      url: "https://example.com/existing",
      order: 0,
    },
  });

  await prisma.$disconnect();
  console.log(JSON.stringify({ userId: user.id, username: profile.username }));
}

main();
