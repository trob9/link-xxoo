export const BUTTON_STYLES = ["raised", "flat", "outline"] as const;
export type ButtonStyle = (typeof BUTTON_STYLES)[number];

// Background texture for the public page. Rendered entirely in CSS from the
// theme's own ink colour (see [data-pattern] in globals.css) — no image
// assets, so it costs nothing to serve and works on every preset.
export const BACKGROUND_PATTERNS = ["none", "dots", "grid"] as const;
export type BackgroundPattern = (typeof BACKGROUND_PATTERNS)[number];

export const BACKGROUND_PATTERN_LABELS: Record<BackgroundPattern, string> = {
  none: "Plain",
  dots: "Dots",
  grid: "Grid",
};

export type ThemeConfig = {
  background: string;
  surface: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentInk: string;
  buttonStyle: ButtonStyle;
  backgroundPattern: BackgroundPattern;
  displayFont: "fraunces" | "space-grotesk" | "space-mono";
};

export type ThemePreset = {
  key: string;
  label: string;
  description: string;
  config: ThemeConfig;
};

// Six presets, each with its own personality — deliberately not the usual
// blue-to-purple gradient card. Every preset still reads as "one product,"
// same neobrutalist bones (hard borders, flat shadows), different palette.
export const THEME_PRESETS: ThemePreset[] = [
  {
    key: "dawn",
    label: "Dawn",
    description: "Cream and coral — the house default.",
    config: {
      background: "#efe6d4",
      surface: "#fffdf8",
      ink: "#211d1a",
      inkMuted: "#6b6259",
      accent: "#ff5c39",
      accentInk: "#1c1108",
      buttonStyle: "raised",
      backgroundPattern: "none",
      displayFont: "fraunces",
    },
  },
  {
    key: "ink",
    label: "Ink",
    description: "Charcoal and acid green, for night owls.",
    config: {
      background: "#16130f",
      surface: "#211c16",
      ink: "#f5efe4",
      inkMuted: "#a79c8d",
      accent: "#c6ff4d",
      accentInk: "#16210a",
      buttonStyle: "raised",
      backgroundPattern: "grid",
      displayFont: "space-grotesk",
    },
  },
  {
    key: "riso",
    label: "Riso",
    description: "Risograph-print pink and blue, layered flat colors.",
    config: {
      background: "#fdf0e6",
      surface: "#ffffff",
      ink: "#1c1a2e",
      inkMuted: "#5c5470",
      accent: "#ff3d7f",
      accentInk: "#fff7fa",
      buttonStyle: "flat",
      backgroundPattern: "dots",
      displayFont: "fraunces",
    },
  },
  {
    key: "paper",
    label: "Paper",
    description: "Newsprint contrast: cream and true black, no color.",
    config: {
      background: "#f6f1e4",
      surface: "#fffef9",
      ink: "#0e0d0b",
      inkMuted: "#57534a",
      accent: "#0e0d0b",
      accentInk: "#f6f1e4",
      buttonStyle: "outline",
      backgroundPattern: "none",
      displayFont: "space-mono",
    },
  },
  {
    key: "neon-grid",
    label: "Neon Grid",
    description: "Deep navy with electric-blue accents.",
    config: {
      background: "#0b0f1a",
      surface: "#131a2b",
      ink: "#e7ecff",
      inkMuted: "#8b93b8",
      accent: "#4dd6ff",
      accentInk: "#03131a",
      buttonStyle: "raised",
      backgroundPattern: "grid",
      displayFont: "space-grotesk",
    },
  },
  {
    key: "citrus",
    label: "Citrus",
    description: "Orange and lime, high dopamine.",
    config: {
      background: "#fff3d6",
      surface: "#ffffff",
      ink: "#2a1d05",
      inkMuted: "#7a6a3f",
      accent: "#ff9f1c",
      accentInk: "#2a1d05",
      buttonStyle: "flat",
      backgroundPattern: "dots",
      displayFont: "fraunces",
    },
  },
];

export function getThemePreset(key: string): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.key === key) ?? THEME_PRESETS[0];
}

export function resolveThemeConfig(
  presetKey: string,
  overrides: Partial<ThemeConfig> | null | undefined,
): ThemeConfig {
  const preset = getThemePreset(presetKey);
  return { ...preset.config, ...(overrides ?? {}) };
}

export const DISPLAY_FONT_STACK: Record<ThemeConfig["displayFont"], string> = {
  fraunces: "var(--font-display), serif",
  "space-grotesk": "var(--font-body), sans-serif",
  "space-mono": "var(--font-stat), monospace",
};
