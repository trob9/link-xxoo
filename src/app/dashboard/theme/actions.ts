"use server";

import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { revalidateProfilePages } from "@/lib/revalidate";
import {
  BUTTON_STYLES,
  getThemePreset,
  THEME_PRESETS,
  type ButtonStyle,
  type ThemeConfig,
} from "@/lib/themes";

export type ThemeState = { ok?: boolean; error?: string };

const HEX = /^#[0-9a-fA-F]{6}$/;

export async function updateTheme(
  _prev: ThemeState,
  formData: FormData,
): Promise<ThemeState> {
  const { profile } = await requireProfile();

  const presetKey = String(formData.get("presetKey") ?? "");
  if (!THEME_PRESETS.some((p) => p.key === presetKey)) {
    return { error: "Unknown theme preset" };
  }
  const presetConfig = getThemePreset(presetKey).config;

  const overrides: Partial<ThemeConfig> = {};

  // Accent override only counts if the toggle is on AND it differs from preset.
  if (formData.get("accentEnabled") === "on") {
    const accent = String(formData.get("accent") ?? "").trim();
    if (!HEX.test(accent)) return { error: "Accent must be a hex colour" };
    if (accent.toLowerCase() !== presetConfig.accent.toLowerCase()) {
      overrides.accent = accent;
    }
  }

  const buttonStyle = String(formData.get("buttonStyle") ?? "");
  if (
    BUTTON_STYLES.includes(buttonStyle as ButtonStyle) &&
    buttonStyle !== presetConfig.buttonStyle
  ) {
    overrides.buttonStyle = buttonStyle as ButtonStyle;
  }

  const themeConfig =
    Object.keys(overrides).length > 0 ? JSON.stringify(overrides) : null;

  await prisma.profile.update({
    where: { id: profile.id },
    data: { themePreset: presetKey, themeConfig },
  });

  revalidateProfilePages("/dashboard/theme", profile.username);
  return { ok: true };
}
