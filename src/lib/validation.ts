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

export const linkSchema = z.object({
  title: z.string().trim().min(1, "Required").max(80),
  url: z.string().trim().url("Must be a valid URL"),
  icon: z.string().trim().max(40).optional().nullable(),
  featured: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
});

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z.string().trim().min(1, "Required"),
});

export const profileSettingsSchema = z.object({
  displayName: z.string().trim().min(1, "Required").max(60),
  bio: z.string().trim().max(280).optional().nullable(),
  seoTitle: z.string().trim().max(70).optional().nullable(),
  seoDescription: z.string().trim().max(160).optional().nullable(),
  sensitiveContent: z.boolean().optional(),
});
