import type { CSSProperties } from "react";
import type { ButtonStyle } from "./themes";

export type ButtonStyleColors = {
  accent: string;
  accentInk: string;
  ink: string;
};

// The hard/soft/outline visual rules, shared between the real public-profile
// link button (fed CSS var() strings so it stays correct across theme
// presets) and the dashboard's theme-editor preview (fed literal hex
// values) — one definition of what each style looks like.
export function buttonStyleVariant(
  style: ButtonStyle,
  { accent, accentInk, ink }: ButtonStyleColors,
): CSSProperties {
  if (style === "hard") {
    return {
      background: accent,
      color: accentInk,
      border: `2px solid ${ink}`,
      borderRadius: 10,
      boxShadow: `4px 4px 0 0 ${ink}`,
    };
  }
  if (style === "soft") {
    return {
      background: accent,
      color: accentInk,
      border: "none",
      borderRadius: 14,
    };
  }
  return {
    background: "transparent",
    color: ink,
    border: `2px solid ${accent}`,
    borderRadius: 10,
  };
}
