import { describe, expect, it } from "vitest";
import { getThemePreset, resolveThemeConfig, THEME_PRESETS } from "@/lib/themes";

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
});
