import { describe, expect, it } from "vitest";
import {
  avatarDisplaySchema,
  linkSchema,
  normalizeSocialUrl,
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

  it("rejects javascript: URIs (stored-XSS vector on the public link button)", () => {
    expect(() =>
      linkSchema.parse({ title: "XSS", url: "javascript:alert(1)" }),
    ).toThrow();
  });

  it("rejects data: and vbscript: URIs", () => {
    expect(() =>
      linkSchema.parse({ title: "XSS", url: "data:text/html,<script>1</script>" }),
    ).toThrow();
    expect(() =>
      linkSchema.parse({ title: "XSS", url: "vbscript:msgbox(1)" }),
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

  it("accepts a single emoji as the icon", () => {
    const result = linkSchema.parse({
      title: "Music",
      url: "https://example.com",
      icon: "🎵",
    });
    expect(result.icon).toBe("🎵");
  });

  it("accepts a null/omitted icon", () => {
    const result = linkSchema.parse({
      title: "No icon",
      url: "https://example.com",
      icon: null,
    });
    expect(result.icon).toBeNull();
  });

  it("rejects plain text as the icon", () => {
    expect(() =>
      linkSchema.parse({
        title: "Bad icon",
        url: "https://example.com",
        icon: "music",
      }),
    ).toThrow();
  });

  it("rejects multiple emoji as the icon", () => {
    expect(() =>
      linkSchema.parse({
        title: "Two emoji",
        url: "https://example.com",
        icon: "🎵🔥",
      }),
    ).toThrow();
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

  it("rejects a javascript: URI for a non-email platform", () => {
    expect(() =>
      socialLinkSchema.parse({ platform: "website", url: "javascript:alert(1)" }),
    ).toThrow();
  });

  it("requires a valid email address for the email platform", () => {
    expect(() =>
      socialLinkSchema.parse({ platform: "email", url: "javascript:alert(1)" }),
    ).toThrow();
    const result = socialLinkSchema.parse({
      platform: "email",
      url: "hello@example.com",
    });
    expect(result.url).toBe("hello@example.com");
  });

  it("only allows partner-site links for a restricted platform", () => {
    expect(() =>
      socialLinkSchema.parse({
        platform: "instagram",
        url: "https://not-instagram-at-all.com/example",
      }),
    ).toThrow();

    const result = socialLinkSchema.parse({
      platform: "instagram",
      url: "https://www.instagram.com/example",
    });
    expect(result.url).toBe("https://www.instagram.com/example");
  });

  it("accepts facebook.com links for the facebook platform", () => {
    const result = socialLinkSchema.parse({
      platform: "facebook",
      url: "https://www.facebook.com/example",
    });
    expect(result.platform).toBe("facebook");
  });

  it("rejects a non-facebook link for the facebook platform", () => {
    expect(() =>
      socialLinkSchema.parse({
        platform: "facebook",
        url: "https://instagram.com/example",
      }),
    ).toThrow();
  });

  it("accepts any http(s) URL for the generic website platform", () => {
    const result = socialLinkSchema.parse({
      platform: "website",
      url: "https://anything-at-all.example",
    });
    expect(result.platform).toBe("website");
  });
});

describe("normalizeSocialUrl", () => {
  it("https-normalizes URL-based platforms", () => {
    expect(normalizeSocialUrl("instagram", "instagram.com/example")).toBe(
      "https://instagram.com/example",
    );
  });

  it("leaves an email address alone (not treated as a URL)", () => {
    expect(normalizeSocialUrl("email", "hello@example.com")).toBe(
      "hello@example.com",
    );
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

describe("avatarDisplaySchema", () => {
  it("accepts a valid shape and enabled flag", () => {
    const result = avatarDisplaySchema.parse({
      avatarShape: "rounded",
      avatarEnabled: true,
    });
    expect(result.avatarShape).toBe("rounded");
    expect(result.avatarEnabled).toBe(true);
  });

  it("rejects an unknown shape", () => {
    expect(() =>
      avatarDisplaySchema.parse({
        avatarShape: "hexagon",
        avatarEnabled: true,
      }),
    ).toThrow();
  });
});
