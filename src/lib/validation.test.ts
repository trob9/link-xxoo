import { describe, expect, it } from "vitest";
import {
  linkSchema,
  profileSettingsSchema,
  socialLinkSchema,
  usernameSchema,
} from "@/lib/validation";

describe("usernameSchema", () => {
  it("accepts a normal lowercase slug", () => {
    expect(usernameSchema.parse("tom-builds")).toBe("tom-builds");
  });

  it("lowercases and trims input", () => {
    expect(usernameSchema.parse("  TomBuilds  ")).toBe("tombuilds");
  });

  it("rejects usernames shorter than 3 characters", () => {
    expect(() => usernameSchema.parse("ab")).toThrow();
  });

  it("rejects usernames with invalid characters", () => {
    expect(() => usernameSchema.parse("tom_builds!")).toThrow();
  });

  it("rejects reserved usernames", () => {
    expect(() => usernameSchema.parse("dashboard")).toThrow();
    expect(() => usernameSchema.parse("admin")).toThrow();
  });
});

describe("linkSchema", () => {
  it("accepts a minimal valid link", () => {
    const result = linkSchema.parse({
      title: "My site",
      url: "https://example.com",
    });
    expect(result.title).toBe("My site");
    expect(result.url).toBe("https://example.com");
  });

  it("rejects an invalid URL", () => {
    expect(() =>
      linkSchema.parse({ title: "Bad", url: "not-a-url" }),
    ).toThrow();
  });

  it("rejects an empty title", () => {
    expect(() =>
      linkSchema.parse({ title: "", url: "https://example.com" }),
    ).toThrow();
  });

  it("coerces schedule date strings", () => {
    const result = linkSchema.parse({
      title: "Scheduled",
      url: "https://example.com",
      startsAt: "2026-01-01T00:00",
    });
    expect(result.startsAt).toBeInstanceOf(Date);
  });
});

describe("socialLinkSchema", () => {
  it("accepts a known platform", () => {
    const result = socialLinkSchema.parse({
      platform: "instagram",
      url: "https://instagram.com/example",
    });
    expect(result.platform).toBe("instagram");
  });

  it("rejects an unknown platform", () => {
    expect(() =>
      socialLinkSchema.parse({ platform: "myspace", url: "https://x.com" }),
    ).toThrow();
  });
});

describe("profileSettingsSchema", () => {
  it("accepts a valid settings payload", () => {
    const result = profileSettingsSchema.parse({
      displayName: "Tom",
      bio: "Building things.",
      sensitiveContent: false,
    });
    expect(result.displayName).toBe("Tom");
  });

  it("rejects an empty display name", () => {
    expect(() =>
      profileSettingsSchema.parse({ displayName: "" }),
    ).toThrow();
  });

  it("rejects a bio over 280 characters", () => {
    expect(() =>
      profileSettingsSchema.parse({
        displayName: "Tom",
        bio: "a".repeat(281),
      }),
    ).toThrow();
  });
});
