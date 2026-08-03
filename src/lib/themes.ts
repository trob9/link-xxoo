export type ButtonStyle = "hard" | "soft" | "outline";

export type ThemeConfig = {
  background: string;
  surface: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentInk: string;
  buttonStyle: ButtonStyle;
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
      buttonStyle: "hard",
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
      buttonStyle: "hard",
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
      buttonStyle: "soft",
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
      buttonStyle: "hard",
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
      buttonStyle: "soft",
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
