import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { linkVisibilityWhere } from "@/lib/links";
import { parseStoredThemeConfig, resolveThemeConfig } from "@/lib/themes";
import type { AvatarShape } from "@/lib/avatar-shape";
import { ThemeEditor, type SavedTheme } from "../_components/theme/ThemeEditor";

// Enough rows to show the button style and the featured treatment; past that
// the preview is just repeating itself.
const PREVIEW_LINK_LIMIT = 3;

const PLACEHOLDER_LINKS = [
  { title: "Latest release", featured: true },
  { title: "Shop", featured: false },
  { title: "Newsletter", featured: false },
];

// Same idea for the icon row: with no socials added yet the "Social icons"
// colour would have nothing to paint, and the control would look broken.
const PLACEHOLDER_SOCIALS = ["instagram", "x", "github", "email"];

export default async function ThemePage() {
  const { profile } = await requireProfile();

  const [savedThemes, links, socials, hasCustomAvatar] = await Promise.all([
    prisma.customTheme.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.link.findMany({
      where: { profileId: profile.id, ...linkVisibilityWhere(new Date()) },
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      take: PREVIEW_LINK_LIMIT,
      select: { title: true, featured: true },
    }),
    prisma.socialLink.findMany({
      where: { profileId: profile.id },
      orderBy: { order: "asc" },
      select: { platform: true },
    }),
    prisma.profile
      .count({ where: { id: profile.id, avatarImage: { not: null } } })
      .then((count) => count > 0),
  ]);

  const config = resolveThemeConfig(
    profile.themePreset,
    parseStoredThemeConfig(profile.themeConfig),
  );

  const avatarSrc = hasCustomAvatar
    ? `/api/avatar/${profile.username}/${profile.updatedAt.getTime()}`
    : profile.avatarUrl;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header>
        <h1 className="font-display text-3xl">Theme</h1>
        <p className="text-sm text-ink-muted">How your public page looks.</p>
      </header>

      <ThemeEditor
        initialConfig={config}
        initialAvatarShape={profile.avatarShape as AvatarShape}
        initialPresetKey={profile.themePreset}
        initialActiveThemeId={profile.activeThemeId}
        savedThemes={savedThemes as SavedTheme[]}
        displayName={profile.displayName}
        bio={profile.bio}
        avatarSrc={avatarSrc}
        avatarEnabled={profile.avatarEnabled}
        previewLinks={links.length > 0 ? links : PLACEHOLDER_LINKS}
        previewSocials={
          socials.length > 0
            ? socials.map((s) => s.platform)
            : PLACEHOLDER_SOCIALS
        }
      />
    </div>
  );
}
