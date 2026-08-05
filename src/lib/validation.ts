import { z } from "zod";
import { isSingleEmoji } from "@/lib/emoji";
import { normalizeUrlInput } from "@/lib/url-normalize";

export const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "dashboard",
  "login",
  "logout",
  "onboarding",
  "settings",
  "www",
  "app",
  "help",
  "support",
  "about",
  "terms",
  "privacy",
  "discord",
  "auth",
]);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(30, "At most 30 characters")
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only")
  .refine((value) => !RESERVED_USERNAMES.has(value), "That name is reserved");

export const SOCIAL_PLATFORMS = [
  "instagram",
  "x",
  "tiktok",
  "youtube",
  "twitch",
  "github",
  "linkedin",
  "facebook",
  "website",
  "email",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

// `z.string().url()` accepts ANY syntactically valid URL, including
// `javascript:`/`vbscript:`/`data:` URIs — and both Link.url and
// SocialLink.url end up as real `<a href>` on public profile pages, so an
// unrestricted scheme here is a stored-XSS vector against profile visitors,
// not just the link owner. Require http(s) explicitly.
function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export const linkSchema = z.object({
  title: z.string().trim().min(1, "Required").max(80),
  url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .refine(isHttpUrl, "Must be an http:// or https:// URL"),
  icon: z
    .string()
    .trim()
    .refine(isSingleEmoji, "Must be a single emoji")
    .optional()
    .nullable(),
  featured: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
});

// Platforms where we only accept links that actually go to that partner
// site — not just "any http(s) URL" like the generic "website" option.
// Hostnames are matched exactly (case-insensitive) against the URL's own
// hostname, which the WHATWG URL parser already lowercases.
// Exported so the dashboard UI can show "must be an instagram.com link"
// style hints without duplicating the domain list.
export const PLATFORM_HOSTS: Partial<Record<SocialPlatform, string[]>> = {
  instagram: ["instagram.com", "www.instagram.com"],
  x: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
  tiktok: ["tiktok.com", "www.tiktok.com"],
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
  twitch: ["twitch.tv", "www.twitch.tv"],
  github: ["github.com", "www.github.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
  facebook: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com"],
};

// The "email" platform stores a bare address, not a URL — everything else
// gets the same https-normalization as the main link URL field applies
// (see normalizeUrlInput). Call this on the raw form value before handing
// it to socialLinkSchema.
export function normalizeSocialUrl(platform: string, rawUrl: string): string {
  if (platform === "email") return rawUrl.trim();
  return normalizeUrlInput(rawUrl);
}

export const socialLinkSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORMS),
    url: z.string().trim().min(1, "Required"),
  })
  .superRefine((data, ctx) => {
    if (data.platform === "email") {
      if (!z.string().email().safeParse(data.url).success) {
        ctx.addIssue({
          code: "custom",
          path: ["url"],
          message: "Must be a valid email address",
        });
      }
      return;
    }

    if (!isHttpUrl(data.url)) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "Must be an http:// or https:// URL",
      });
      return;
    }

    const allowedHosts = PLATFORM_HOSTS[data.platform];
    if (!allowedHosts) return; // "website" — any http(s) URL is fine

    let hostname: string;
    try {
      hostname = new URL(data.url).hostname.toLowerCase();
    } catch {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Must be a valid URL" });
      return;
    }

    if (!allowedHosts.includes(hostname)) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: `Must be a link to ${allowedHosts[0]}`,
      });
    }
  });

export const profileSettingsSchema = z.object({
  displayName: z.string().trim().min(1, "Required").max(60),
  bio: z.string().trim().max(280).optional().nullable(),
  seoTitle: z.string().trim().max(70).optional().nullable(),
  seoDescription: z.string().trim().max(160).optional().nullable(),
  sensitiveContent: z.boolean().optional(),
});
