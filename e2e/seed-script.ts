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
    where: {
      provider_providerAccountId: {
        provider: TEST_USER.provider,
        providerAccountId: TEST_USER.providerAccountId,
      },
    },
    update: {},
    create: {
      provider: TEST_USER.provider,
      providerAccountId: TEST_USER.providerAccountId,
    },
  });

  // Every mutable field the suite touches is reset here, not just the ones a
  // given test uses: the dashboard tests run serially against one shared
  // sqlite file, so anything left behind becomes the next test's start state.
  const resetFields = {
    displayName: TEST_USER.displayName,
    avatarUrl: null,
    avatarImage: null,
    avatarShape: "circle",
    avatarEnabled: true,
    themePreset: "dawn",
    themeConfig: null,
    activeThemeId: null,
  };

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: resetFields,
    create: {
      userId: user.id,
      username: TEST_USER.username,
      ...resetFields,
    },
  });

  await prisma.link.deleteMany({ where: { profileId: profile.id } });
  await prisma.socialLink.deleteMany({ where: { profileId: profile.id } });
  await prisma.customTheme.deleteMany({ where: { profileId: profile.id } });
  await prisma.profileView.deleteMany({ where: { profileId: profile.id } });
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
