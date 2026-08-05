"use server";

import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import {
  normalizeSocialUrl,
  profileSettingsSchema,
  socialLinkSchema,
} from "@/lib/validation";
import { nullIfBlank } from "@/lib/forms";
import { revalidateProfilePages } from "@/lib/revalidate";

export type SettingsState = { ok?: boolean; error?: string };

function revalidateSettings(username: string) {
  revalidateProfilePages("/dashboard/settings", username);
}

export async function updateProfileSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { profile } = await requireProfile();

  const parsed = profileSettingsSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: nullIfBlank(formData.get("bio")),
    seoTitle: nullIfBlank(formData.get("seoTitle")),
    seoDescription: nullIfBlank(formData.get("seoDescription")),
    sensitiveContent: formData.get("sensitiveContent") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      displayName: parsed.data.displayName,
      bio: parsed.data.bio ?? null,
      seoTitle: parsed.data.seoTitle ?? null,
      seoDescription: parsed.data.seoDescription ?? null,
      sensitiveContent: parsed.data.sensitiveContent ?? false,
    },
  });

  revalidateSettings(profile.username);
  return { ok: true };
}

export async function addSocialLink(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { profile } = await requireProfile();

  const rawPlatform = String(formData.get("platform") ?? "");
  const parsed = socialLinkSchema.safeParse({
    platform: rawPlatform,
    url: normalizeSocialUrl(rawPlatform, String(formData.get("url") ?? "")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid social link" };
  }

  const last = await prisma.socialLink.findFirst({
    where: { profileId: profile.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.socialLink.create({
    data: {
      profileId: profile.id,
      platform: parsed.data.platform,
      url: parsed.data.url,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateSettings(profile.username);
  return { ok: true };
}

export async function deleteSocialLink(id: string): Promise<void> {
  const { profile } = await requireProfile();
  await prisma.socialLink.deleteMany({
    where: { id, profileId: profile.id },
  });
  revalidateSettings(profile.username);
}
