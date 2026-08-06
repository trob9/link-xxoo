"use server";

import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { revalidateProfilePages } from "@/lib/revalidate";
import { isPresetKey, type ThemeConfig } from "@/lib/themes";
import { themeConfigSchema, themeNameSchema } from "@/lib/validation";
import { AVATAR_SHAPES, type AvatarShape } from "@/lib/avatar-shape";

/**
 * `saved` echoes back exactly what was persisted. The editor uses it to reset
 * its "unsaved changes" baseline directly, rather than waiting for
 * revalidation to push fresh props down — which is a race it can lose, and
 * which does nothing at all when a save happens to write the values the row
 * already held.
 */
export type ThemeState = {
  ok?: boolean;
  error?: string;
  saved?: {
    config: ThemeConfig;
    avatarShape: AvatarShape | null;
    activeThemeId: string | null;
  };
};

// How many named themes one profile may keep. Not a paywall — a bound on a
// user-growable table so a scripted client can't fill the disk.
const MAX_CUSTOM_THEMES = 24;

function readConfig(formData: FormData):
  | { ok: true; config: ThemeConfig }
  | { ok: false; error: string } {
  const parsed = themeConfigSchema.safeParse({
    background: formData.get("background"),
    surface: formData.get("surface"),
    ink: formData.get("ink"),
    inkMuted: formData.get("inkMuted"),
    accent: formData.get("accent"),
    accentInk: formData.get("accentInk"),
    buttonStyle: formData.get("buttonStyle"),
    backgroundPattern: formData.get("backgroundPattern"),
    displayFont: formData.get("displayFont"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid theme" };
  }
  return { ok: true, config: parsed.data };
}

// The avatar's shape is edited on this page (it's a design choice, so it sits
// next to button style) but it is NOT part of ThemeConfig — switching themes
// must not silently reshape your picture.
function readAvatarShape(formData: FormData): AvatarShape | null {
  const raw = String(formData.get("avatarShape") ?? "");
  return AVATAR_SHAPES.includes(raw as AvatarShape) ? (raw as AvatarShape) : null;
}

function readPresetKey(formData: FormData): string | null {
  const raw = String(formData.get("presetKey") ?? "");
  return isPresetKey(raw) ? raw : null;
}

/**
 * Applies the editor's draft to the live public page. If the draft came from
 * one of the owner's saved themes, that theme is updated to match too — so
 * "Save" means one thing: my page and my theme now look like this.
 */
export async function saveTheme(
  _prev: ThemeState,
  formData: FormData,
): Promise<ThemeState> {
  const { profile } = await requireProfile();

  const parsed = readConfig(formData);
  if (!parsed.ok) return { error: parsed.error };
  const config = parsed.config;

  const requestedThemeId = String(formData.get("activeThemeId") ?? "").trim();
  // Ownership check, not just existence: an id from another profile would
  // otherwise let one owner overwrite another's saved theme.
  const activeTheme = requestedThemeId
    ? await prisma.customTheme.findFirst({
        where: { id: requestedThemeId, profileId: profile.id },
        select: { id: true },
      })
    : null;

  const avatarShape = readAvatarShape(formData);
  const presetKey = readPresetKey(formData);

  await prisma.$transaction(async (tx) => {
    if (activeTheme) {
      await tx.customTheme.update({
        where: { id: activeTheme.id },
        data: config,
      });
    }
    await tx.profile.update({
      where: { id: profile.id },
      data: {
        themeConfig: JSON.stringify(config),
        activeThemeId: activeTheme?.id ?? null,
        ...(presetKey ? { themePreset: presetKey } : {}),
        ...(avatarShape ? { avatarShape } : {}),
      },
    });
  });

  revalidateProfilePages("/dashboard/theme", profile.username);
  return {
    ok: true,
    saved: { config, avatarShape, activeThemeId: activeTheme?.id ?? null },
  };
}

/** Stores the draft as a new named theme and makes it the live one. */
export async function saveThemeAs(
  _prev: ThemeState,
  formData: FormData,
): Promise<ThemeState> {
  const { profile } = await requireProfile();

  const parsed = readConfig(formData);
  if (!parsed.ok) return { error: parsed.error };

  const name = themeNameSchema.safeParse(formData.get("name"));
  if (!name.success) {
    return { error: name.error.issues[0]?.message ?? "Invalid name" };
  }

  const existing = await prisma.customTheme.count({
    where: { profileId: profile.id },
  });
  if (existing >= MAX_CUSTOM_THEMES) {
    return { error: `You can keep up to ${MAX_CUSTOM_THEMES} themes` };
  }

  const avatarShape = readAvatarShape(formData);
  const presetKey = readPresetKey(formData);

  const created = await prisma.$transaction(async (tx) => {
    const theme = await tx.customTheme.create({
      data: { profileId: profile.id, name: name.data, ...parsed.config },
      select: { id: true },
    });
    await tx.profile.update({
      where: { id: profile.id },
      data: {
        themeConfig: JSON.stringify(parsed.config),
        activeThemeId: theme.id,
        ...(presetKey ? { themePreset: presetKey } : {}),
        ...(avatarShape ? { avatarShape } : {}),
      },
    });
    return theme;
  });

  revalidateProfilePages("/dashboard/theme", profile.username);
  return {
    ok: true,
    saved: {
      config: parsed.config,
      avatarShape,
      activeThemeId: created.id,
    },
  };
}

export async function renameCustomTheme(
  _prev: ThemeState,
  formData: FormData,
): Promise<ThemeState> {
  const { profile } = await requireProfile();

  const id = String(formData.get("themeId") ?? "");
  const name = themeNameSchema.safeParse(formData.get("name"));
  if (!name.success) {
    return { error: name.error.issues[0]?.message ?? "Invalid name" };
  }

  const { count } = await prisma.customTheme.updateMany({
    where: { id, profileId: profile.id },
    data: { name: name.data },
  });
  if (count === 0) return { error: "That theme no longer exists" };

  revalidateProfilePages("/dashboard/theme", profile.username);
  return { ok: true };
}

/**
 * Deletes a saved theme. The live page keeps whatever it currently looks like
 * — themeConfig already holds the resolved colours, so deleting the theme it
 * came from unlinks it rather than resetting anyone's page underneath them.
 */
export async function deleteCustomTheme(formData: FormData): Promise<void> {
  const { profile } = await requireProfile();
  const id = String(formData.get("themeId") ?? "");

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.customTheme.deleteMany({
      where: { id, profileId: profile.id },
    });
    if (count > 0) {
      await tx.profile.updateMany({
        where: { id: profile.id, activeThemeId: id },
        data: { activeThemeId: null },
      });
    }
  });

  revalidateProfilePages("/dashboard/theme", profile.username);
}
