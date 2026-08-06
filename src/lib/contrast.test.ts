import { describe, expect, it } from "vitest";
import {
  contrastLevel,
  contrastRatio,
  formatRatio,
  isHexColor,
  normalizeHex,
  relativeLuminance,
  suggestReadable,
} from "./contrast";

describe("normalizeHex", () => {
  it("expands shorthand and lowercases", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("  #FF5C39 ")).toBe("#ff5c39");
  });

  it("rejects anything that isn't a hex colour", () => {
    expect(normalizeHex("red")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("rgb(0,0,0)")).toBeNull();
  });
});

describe("isHexColor", () => {
  it("accepts 3- and 6-digit forms", () => {
    expect(isHexColor("#fff")).toBe(true);
    expect(isHexColor("#ff5c39")).toBe(true);
    expect(isHexColor("#gg0000")).toBe(false);
  });
});

describe("relativeLuminance", () => {
  it("anchors at the WCAG endpoints", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("returns 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("returns 1 for a colour against itself", () => {
    expect(contrastRatio("#ff5c39", "#ff5c39")).toBeCloseTo(1, 5);
  });

  it("is order-independent", () => {
    const a = contrastRatio("#211d1a", "#efe6d4");
    const b = contrastRatio("#efe6d4", "#211d1a");
    expect(a).toBeCloseTo(b as number, 10);
  });

  it("is null when a colour is unparseable", () => {
    expect(contrastRatio("nope", "#ffffff")).toBeNull();
  });
});

describe("contrastLevel", () => {
  it("bands by the WCAG thresholds", () => {
    expect(contrastLevel(21)).toBe("aaa");
    expect(contrastLevel(7)).toBe("aaa");
    expect(contrastLevel(4.5)).toBe("aa");
    expect(contrastLevel(3)).toBe("aa-large");
    expect(contrastLevel(2.9)).toBe("fail");
  });
});

describe("formatRatio", () => {
  it("quotes to one decimal", () => {
    expect(formatRatio(4.4999)).toBe("4.5:1");
    expect(formatRatio(21)).toBe("21:1");
  });
});

describe("suggestReadable", () => {
  it("darkens ink on a light background until it passes", () => {
    const bg = "#efe6d4";
    const fixed = suggestReadable("#d8cdb8", bg);
    expect(fixed).not.toBeNull();
    expect(contrastRatio(fixed as string, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("lightens ink on a dark background until it passes", () => {
    const bg = "#16130f";
    const fixed = suggestReadable("#2a2620", bg);
    expect(fixed).not.toBeNull();
    expect(contrastRatio(fixed as string, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("returns an already-passing colour unchanged", () => {
    expect(suggestReadable("#211d1a", "#ffffff")).toBe("#211d1a");
  });

  // A saturated pink has a below-halfway luminance but still can't reach 4.5
  // against white, so picking a direction from the background's luminance
  // alone returns an unreadable colour. Both directions have to be tried.
  it("darkens against a mid-luminance background that lightening can't fix", () => {
    const bg = "#ff3d7f";
    const fixed = suggestReadable("#fff7fa", bg);
    expect(fixed).not.toBeNull();
    expect(contrastRatio(fixed as string, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("always clears the target for every preset-like background", () => {
    for (const bg of ["#efe6d4", "#16130f", "#fdf0e6", "#ff9f1c", "#4dd6ff"]) {
      const fixed = suggestReadable("#808080", bg);
      expect(contrastRatio(fixed as string, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("is null for an invalid colour", () => {
    expect(suggestReadable("nope", "#ffffff")).toBeNull();
  });

  it("can reach the stricter AAA target", () => {
    const bg = "#fff3d6";
    const fixed = suggestReadable("#7a6a3f", bg, 7);
    expect(contrastRatio(fixed as string, bg)).toBeGreaterThanOrEqual(7);
  });
});
