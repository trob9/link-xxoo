"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { linkSchema } from "@/lib/validation";

export type FormState = { ok?: boolean; error?: string };

function revalidateProfile(username: string) {
  revalidatePath("/dashboard");
  revalidatePath("/" + username);
}

// datetime-local inputs submit "" when empty; z.coerce.date() would choke on
// that, so normalise blanks to null before validating.
function parseLinkForm(formData: FormData) {
  const rawStart = String(formData.get("startsAt") ?? "").trim();
  const rawEnd = String(formData.get("endsAt") ?? "").trim();
  const rawIcon = String(formData.get("icon") ?? "").trim();

  return linkSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
    icon: rawIcon === "" ? null : rawIcon,
    featured: formData.get("featured") === "on",
    startsAt: rawStart === "" ? null : rawStart,
    endsAt: rawEnd === "" ? null : rawEnd,
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
