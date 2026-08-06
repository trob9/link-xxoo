// WCAG 2.1 contrast maths. Pure and client-safe — the theme editor runs this
// on every keystroke to tell an owner, before they save, that the colours
// they just picked are unreadable.

export type ContrastLevel = "fail" | "aa-large" | "aa" | "aaa";

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value.trim());
}

/** Expands #abc to #aabbcc and lowercases. Returns null if not a hex colour. */
export function normalizeHex(value: string): string | null {
  const raw = value.trim().toLowerCase();
  if (!HEX_RE.test(raw)) return null;
  if (raw.length === 4) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
  }
  return raw;
}

function toRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

// WCAG 2.1 relative luminance. The per-channel curve undoes sRGB's gamma
// encoding, so this measures perceived light output rather than the raw
// 0–255 byte.
function channelLuminance(byte: number): number {
  const c = byte / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number | null {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Contrast ratio between two colours, 1 (identical) to 21 (black on white).
 * Returns null if either colour isn't a hex value.
 */
export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return null;
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG level for a ratio at normal body-text size. `aa-large` means it only
 * clears the relaxed bar for large/bold text (3:1), which is why button
 * labels and body copy are judged separately by the caller.
 */
export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return "aaa";
  if (ratio >= 4.5) return "aa";
  if (ratio >= 3) return "aa-large";
  return "fail";
}

/** Rounded to one decimal, the way contrast ratios are conventionally quoted. */
export function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 10) / 10}:1`;
}

function toHex(channels: number[]): string {
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Nudges `ink` along its own lightness until it clears `target` against `bg`,
 * keeping the owner's hue rather than flattening every failing colour to
 * black or white.
 *
 * Both directions are tried at each step, and the first to clear the target
 * wins — so the answer is the smallest change that works. Choosing a
 * direction up-front from the background's luminance is wrong for mid-tone
 * backgrounds: a saturated pink sits below the halfway mark yet still can't
 * reach 4.5 against white, so "the background is dark, therefore lighten"
 * would confidently return an unreadable colour.
 *
 * If neither direction reaches the target — possible against a mid grey —
 * this returns whichever of black or white does best, which is the most
 * readable colour available.
 */
export function suggestReadable(
  ink: string,
  bg: string,
  target = 4.5,
): string | null {
  const rgb = toRgb(ink);
  if (!rgb || relativeLuminance(bg) === null) return null;

  const clears = (candidate: string) => {
    const ratio = contrastRatio(candidate, bg);
    return ratio !== null && ratio >= target;
  };

  if (clears(toHex(rgb))) return toHex(rgb);

  for (let step = 1; step <= 100; step += 1) {
    const t = step / 100;
    const darker = toHex(rgb.map((c) => Math.round(c * (1 - t))));
    if (clears(darker)) return darker;
    const lighter = toHex(rgb.map((c) => Math.round(c + (255 - c) * t)));
    if (clears(lighter)) return lighter;
  }

  const black = contrastRatio("#000000", bg) ?? 0;
  const white = contrastRatio("#ffffff", bg) ?? 0;
  return black >= white ? "#000000" : "#ffffff";
}
