import type { CSSProperties } from "react";

export type SocialIconColors = {
  surface: string;
  ink: string;
};

// The social icon tile, shared between the real public-profile social row
// (fed CSS var() strings so it stays correct across theme presets) and the
// dashboard's theme-editor preview (fed literal hex values, at a smaller
// size) — same rule as buttonStyleVariant, one definition of the look.
//
// Square-ish, not a circle: the design system's rule is no rounded-full
// pills, and this radius matches the link buttons.
export function socialIconStyle(
  { surface, ink }: SocialIconColors,
  size = 42,
): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
    borderRadius: 10,
    background: surface,
    color: ink,
    border: `2px solid ${ink}`,
  };
}
