import { requireProfile } from "@/lib/session";
import type {
  BackgroundPattern,
  ButtonStyle,
  ThemeConfig,
} from "@/lib/themes";
import { ThemeEditor } from "../_components/ThemeEditor";

function parseOverrides(raw: string | null): Partial<ThemeConfig> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export default async function ThemePage() {
  const { profile } = await requireProfile();
  const overrides = parseOverrides(profile.themeConfig);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Theme</h1>
        <p className="text-sm text-ink-muted">
          Pick a preset, then optionally override the accent colour, button
          style, and background. This styles your public page only.
        </p>
      </header>

      <ThemeEditor
        currentPreset={profile.themePreset}
        accentOverride={overrides.accent ?? null}
        buttonStyleOverride={(overrides.buttonStyle as ButtonStyle) ?? null}
        backgroundPatternOverride={
          (overrides.backgroundPattern as BackgroundPattern) ?? null
        }
      />
    </div>
  );
}
