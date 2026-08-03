"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { profileSettingsSchema, socialLinkSchema } from "@/lib/validation";

export type SettingsState = { ok?: boolean; error?: string };

function nullIfBlank(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
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

  revalidatePath("/dashboard/settings");
  revalidatePath("/" + profile.username);
  return { ok: true };
}

export async function addSocialLink(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { profile } = await requireProfile();

  const parsed = socialLinkSchema.safeParse({
    platform: formData.get("platform"),
    url: formData.get("url"),
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

  revalidatePath("/dashboard/settings");
  revalidatePath("/" + profile.username);
  return { ok: true };
}

export async function deleteSocialLink(id: string): Promise<void> {
  const { profile } = await requireProfile();
  await prisma.socialLink.deleteMany({
    where: { id, profileId: profile.id },
  });
  revalidatePath("/dashboard/settings");
  revalidatePath("/" + profile.username);
}
