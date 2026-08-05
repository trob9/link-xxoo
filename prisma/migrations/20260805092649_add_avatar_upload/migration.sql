-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "avatarImage" BLOB,
    "avatarShape" TEXT NOT NULL DEFAULT 'circle',
    "avatarEnabled" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "sensitiveContent" BOOLEAN NOT NULL DEFAULT false,
    "themePreset" TEXT NOT NULL DEFAULT 'dawn',
    "themeConfig" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("avatarUrl", "bio", "createdAt", "displayName", "id", "sensitiveContent", "seoDescription", "seoTitle", "themeConfig", "themePreset", "updatedAt", "userId", "username") SELECT "avatarUrl", "bio", "createdAt", "displayName", "id", "sensitiveContent", "seoDescription", "seoTitle", "themeConfig", "themePreset", "updatedAt", "userId", "username" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
