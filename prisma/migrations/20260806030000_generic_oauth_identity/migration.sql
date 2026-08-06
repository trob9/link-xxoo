-- Generalise User identity from Discord-only to (provider, providerAccountId).
-- SQLite can't drop/rename columns in place under Prisma's supported subset,
-- so this is the standard table-rebuild: every existing row is carried over
-- with provider = 'discord' and its old discordId as the account id, which
-- keeps current users signed in and their profiles attached.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "providerAvatar" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "provider", "providerAccountId", "providerAvatar", "email", "createdAt", "updatedAt")
SELECT "id", 'discord', "discordId", "discordAvatar", "email", "createdAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_provider_providerAccountId_key" ON "User"("provider", "providerAccountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
