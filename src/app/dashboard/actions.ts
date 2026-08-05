"use server";

import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import {
  linkSchema,
  normalizeSocialUrl,
  socialLinkSchema,
} from "@/lib/validation";
import { nullIfBlank } from "@/lib/forms";
import { revalidateProfilePages } from "@/lib/revalidate";
import { normalizeUrlInput } from "@/lib/url-normalize";

export type FormState = { ok?: boolean; error?: string };

function revalidateProfile(username: string) {
  revalidateProfilePages("/dashboard", username);
}

// datetime-local inputs submit "" when empty; z.coerce.date() would choke on
// that, so normalise blanks to null before validating.
function parseLinkForm(formData: FormData) {
  return linkSchema.safeParse({
    title: formData.get("title"),
    url: normalizeUrlInput(String(formData.get("url") ?? "")),
    icon: nullIfBlank(formData.get("icon")),
    featured: formData.get("featured") === "on",
    startsAt: nullIfBlank(formData.get("startsAt")),
    endsAt: nullIfBlank(formData.get("endsAt")),
  });
}

export async function createLink(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { profile } = await requireProfile();

  const parsed = parseLinkForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid link" };
  }

  const last = await prisma.link.findFirst({
    where: { profileId: profile.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.link.create({
    data: {
      profileId: profile.id,
      title: parsed.data.title,
      url: parsed.data.url,
      icon: parsed.data.icon ?? null,
      featured: parsed.data.featured ?? false,
      startsAt: parsed.data.startsAt ?? null,
      endsAt: parsed.data.endsAt ?? null,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateProfile(profile.username);
  return { ok: true };
}

export async function updateLink(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { profile } = await requireProfile();

  const parsed = parseLinkForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid link" };
  }

  await prisma.link.updateMany({
    where: { id, profileId: profile.id },
    data: {
      title: parsed.data.title,
      url: parsed.data.url,
      icon: parsed.data.icon ?? null,
      featured: parsed.data.featured ?? false,
      startsAt: parsed.data.startsAt ?? null,
      endsAt: parsed.data.endsAt ?? null,
    },
  });

  revalidateProfile(profile.username);
  return { ok: true };
}

export async function deleteLink(id: string): Promise<void> {
  const { profile } = await requireProfile();
  await prisma.link.deleteMany({ where: { id, profileId: profile.id } });
  revalidateProfile(profile.username);
}

export async function setLinkEnabled(
  id: string,
  enabled: boolean,
): Promise<void> {
  const { profile } = await requireProfile();
  await prisma.link.updateMany({
    where: { id, profileId: profile.id },
    data: { enabled },
  });
  revalidateProfile(profile.username);
}

export async function setLinkFeatured(
  id: string,
  featured: boolean,
): Promise<void> {
  const { profile } = await requireProfile();
  await prisma.link.updateMany({
    where: { id, profileId: profile.id },
    data: { featured },
  });
  revalidateProfile(profile.username);
}

export async function reorderLinks(orderedIds: string[]): Promise<void> {
  const { profile } = await requireProfile();

  // Ownership check: every id must belong to this profile, or we bail.
  const owned = await prisma.link.count({
    where: { id: { in: orderedIds }, profileId: profile.id },
  });
  if (owned !== orderedIds.length) return;

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.link.update({ where: { id }, data: { order: index } }),
    ),
  );

  revalidateProfile(profile.username);
}

/* ------------------------------------------------------------------ *
 * Social icons
 *
 * These live alongside the link actions rather than with the profile
 * settings, because the icon row is content on the public page and is
 * edited from the same screen as the links themselves. They revalidate
 * "/dashboard" for that reason — pointing them at "/dashboard/settings"
 * would write to the database and leave the visible list stale.
 * ------------------------------------------------------------------ */

export async function addSocialLink(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
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

  revalidateProfile(profile.username);
  return { ok: true };
}

export async function deleteSocialLink(id: string): Promise<void> {
  const { profile } = await requireProfile();
  await prisma.socialLink.deleteMany({ where: { id, profileId: profile.id } });
  revalidateProfile(profile.username);
}

export async function reorderSocialLinks(orderedIds: string[]): Promise<void> {
  const { profile } = await requireProfile();

  const owned = await prisma.socialLink.count({
    where: { id: { in: orderedIds }, profileId: profile.id },
  });
  if (owned !== orderedIds.length) return;

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.socialLink.update({ where: { id }, data: { order: index } }),
    ),
  );

  revalidateProfile(profile.username);
}
