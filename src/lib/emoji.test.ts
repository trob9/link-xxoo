import { describe, expect, it } from "vitest";
import { EMOJI_PICKER_OPTIONS, isSingleEmoji } from "@/lib/emoji";

describe("isSingleEmoji", () => {
  it("accepts a simple single emoji", () => {
    expect(isSingleEmoji("😀")).toBe(true);
    expect(isSingleEmoji("🔥")).toBe(true);
  });

  it("accepts a skin-toned emoji", () => {
    expect(isSingleEmoji("👍🏽")).toBe(true);
  });

  it("accepts a flag emoji (regional indicator pair)", () => {
    expect(isSingleEmoji("🇦🇺")).toBe(true);
  });

  it("accepts a ZWJ sequence (family emoji)", () => {
    expect(isSingleEmoji("👨‍👩‍👧‍👦")).toBe(true);
  });

  it("accepts an emoji with a variation selector", () => {
    expect(isSingleEmoji("❤️")).toBe(true);
    expect(isSingleEmoji("☀️")).toBe(true);
  });

  it("rejects plain text", () => {
    expect(isSingleEmoji("hi")).toBe(false);
    expect(isSingleEmoji("a")).toBe(false);
    expect(isSingleEmoji("music")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isSingleEmoji("")).toBe(false);
  });

  it("rejects two emoji concatenated", () => {
    expect(isSingleEmoji("😀😀")).toBe(false);
  });

  it("rejects emoji mixed with text", () => {
    expect(isSingleEmoji("🔥fire")).toBe(false);
  });

  it("accepts every entry in the picker grid", () => {
    for (const emoji of EMOJI_PICKER_OPTIONS) {
      expect(isSingleEmoji(emoji), `expected "${emoji}" to be a single emoji`).toBe(
        true,
      );
    }
  });
});
