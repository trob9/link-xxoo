import { describe, expect, it } from "vitest";
import {
  BACKGROUND_PATTERNS,
  BUTTON_STYLES,
  DISPLAY_FONTS,
  getThemePreset,
  isPresetKey,
  parseStoredThemeConfig,
  resolveThemeConfig,
  themeConfigsEqual,
  THEME_COLOR_KEYS,
  THEME_PRESETS,
  toThemeConfig,
} from "@/lib/themes";
import { contrastRatio } from "@/lib/contrast";

describe("getThemePreset", () => {
  it("returns the matching preset", () => {
    expect(getThemePreset("ink").label).toBe("Ink");
  });

  it("falls back to the first preset for an unknown key", () => {
    expect(getThemePreset("nonexistent")).toEqual(THEME_PRESETS[0]);
  });
});

describe("resolveThemeConfig", () => {
  it("returns the preset config unmodified with no overrides", () => {
    const resolved = resolveThemeConfig("dawn", null);
    expect(resolved).toEqual(getThemePreset("dawn").config);
  });

  it("applies partial overrides on top of the preset", () => {
    const resolved = resolveThemeConfig("dawn", { accent: "#000000" });
    expect(resolved.accent).toBe("#000000");
    expect(resolved.background).toBe(getThemePreset("dawn").config.background);
  });

  it("falls back to the first preset when given an unknown key", () => {
    const resolved = resolveThemeConfig("not-a-real-preset", undefined);
    expect(resolved).toEqual(THEME_PRESETS[0].config);
  });

  it("lets a stored override replace the preset's background pattern", () => {
    const resolved = resolveThemeConfig("dawn", { backgroundPattern: "grid" });
    expect(resolved.backgroundPattern).toBe("grid");
  });
});

describe("resolveThemeConfig with a whole stored theme", () => {
  // The editor now writes the full resolved config into themeConfig, while
  // older rows hold only a couple of overrides. Both have to resolve the same
  // way — that equivalence is why saving full configs needed no migration.
  it("a full stored config wins over every preset field", () => {
    const custom = {
      ...getThemePreset("ink").config,
      accent: "#00e5a0",
      displayFont: "space-mono" as const,
    };
    expect(resolveThemeConfig("dawn", custom)).toEqual(custom);
  });
});

describe("parseStoredThemeConfig", () => {
  it("reads a stored JSON object", () => {
    expect(parseStoredThemeConfig('{"accent":"#123456"}')).toEqual({
      accent: "#123456",
    });
  });

  it("treats null, malformed JSON and non-objects as no overrides", () => {
    expect(parseStoredThemeConfig(null)).toEqual({});
    expect(parseStoredThemeConfig("not json")).toEqual({});
    expect(parseStoredThemeConfig("[1,2]")).not.toBeNull();
    expect(parseStoredThemeConfig('"a string"')).toEqual({});
  });
});

describe("isPresetKey", () => {
  it("recognises built-in keys only", () => {
    expect(isPresetKey("dawn")).toBe(true);
    expect(isPresetKey("my-custom-theme")).toBe(false);
  });
});

describe("themeConfigsEqual", () => {
  const base = getThemePreset("dawn").config;

  it("is true for identical configs", () => {
    expect(themeConfigsEqual(base, { ...base })).toBe(true);
  });

  // Hex values are lowercased on save but a preset's literals are authored by
  // hand — comparing case-sensitively would show "unsaved changes" forever.
  it("ignores hex letter case", () => {
    expect(
      themeConfigsEqual(base, { ...base, accent: base.accent.toUpperCase() }),
    ).toBe(true);
  });

  it("is false when any field differs", () => {
    for (const key of THEME_COLOR_KEYS) {
      expect(themeConfigsEqual(base, { ...base, [key]: "#010203" })).toBe(false);
    }
    expect(themeConfigsEqual(base, { ...base, buttonStyle: "outline" })).toBe(
      false,
    );
    expect(themeConfigsEqual(base, { ...base, displayFont: "space-mono" })).toBe(
      false,
    );
    expect(
      themeConfigsEqual(base, { ...base, backgroundPattern: "grid" }),
    ).toBe(false);
  });
});

describe("toThemeConfig", () => {
  // A CustomTheme row carries id/name/timestamps too; only the theme fields
  // may reach the page's inline styles.
  it("keeps only the theme fields", () => {
    const row = {
      ...getThemePreset("riso").config,
      id: "abc",
      name: "Mine",
      createdAt: new Date(),
    };
    expect(Object.keys(toThemeConfig(row))).toEqual([
      ...THEME_COLOR_KEYS,
      "buttonStyle",
      "backgroundPattern",
      "displayFont",
    ]);
  });
});

describe("preset integrity", () => {
  // Each of these values is rendered through a lookup table or a CSS
  // attribute selector, so an unknown one degrades silently rather than
  // throwing — a test is the only place it surfaces.
  it("every preset declares known enum values", () => {
    for (const preset of THEME_PRESETS) {
      expect(BACKGROUND_PATTERNS).toContain(preset.config.backgroundPattern);
      expect(BUTTON_STYLES).toContain(preset.config.buttonStyle);
      expect(DISPLAY_FONTS).toContain(preset.config.displayFont);
    }
  });

  it("every preset colour is a 6-digit hex value", () => {
    for (const preset of THEME_PRESETS) {
      for (const key of THEME_COLOR_KEYS) {
        expect(preset.config[key]).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  // A shipped preset that fails the editor's own readability check would be
  // telling owners off for a combination we handed them.
  it("every preset passes WCAG AA for body text and button labels", () => {
    for (const preset of THEME_PRESETS) {
      const c = preset.config;
      expect(contrastRatio(c.ink, c.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.ink, c.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.inkMuted, c.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.accentInk, c.accent)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
