import { z } from "zod";

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
  "website",
  "email",
] as const;

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
  icon: z.string().trim().max(40).optional().nullable(),
  featured: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
});

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
    } else if (!isHttpUrl(data.url)) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "Must be an http:// or https:// URL",
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
