import { describe, expect, it } from "vitest";
import { normalizeUrlInput } from "@/lib/url-normalize";

describe("normalizeUrlInput", () => {
  it("prefixes a bare domain with https://", () => {
    expect(normalizeUrlInput("example.com")).toBe("https://example.com");
  });

  it("prefixes a bare domain with a path", () => {
    expect(normalizeUrlInput("example.com/page")).toBe(
      "https://example.com/page",
    );
  });

  it("leaves an https:// URL untouched (no doubling)", () => {
    expect(normalizeUrlInput("https://example.com")).toBe(
      "https://example.com",
    );
  });

  it("upgrades http:// to https:// without doubling", () => {
    expect(normalizeUrlInput("http://example.com")).toBe(
      "https://example.com",
    );
  });

  it("is case-insensitive about an existing scheme", () => {
    expect(normalizeUrlInput("HTTP://Example.com")).toBe(
      "https://Example.com",
    );
  });

  it("handles a protocol-relative URL", () => {
    expect(normalizeUrlInput("//example.com")).toBe("https://example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeUrlInput("  example.com  ")).toBe("https://example.com");
  });

  it("leaves an empty string empty", () => {
    expect(normalizeUrlInput("")).toBe("");
    expect(normalizeUrlInput("   ")).toBe("");
  });
});
