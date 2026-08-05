"use server";

import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import {
  avatarDisplaySchema,
  profileSettingsSchema,
} from "@/lib/validation";
import { nullIfBlank } from "@/lib/forms";
import { revalidateProfilePages } from "@/lib/revalidate";
import {
  AVATAR_MAX_UPLOAD_BYTES,
  isSafeRasterImage,
  processAvatarImage,
} from "@/lib/avatar";

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

// One combined action: shape + visibility always save, and if a new file
// was chosen, it's processed and stored in the same submit — one form, one
// button, rather than juggling separate upload/settings saves.
export async function updateAvatar(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { profile } = await requireProfile();

  const parsed = avatarDisplaySchema.safeParse({
    avatarShape: formData.get("avatarShape"),
    avatarEnabled: formData.get("avatarEnabled") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid avatar settings" };
  }

  let avatarImage: Buffer | undefined;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (file.size > AVATAR_MAX_UPLOAD_BYTES) {
      return { error: "Image must be under 8MB" };
    }
    // file.type is just the client-declared Content-Type of that form-data
    // part — a cheap, friendly early check, not a security boundary (a
    // direct API call can claim anything). isSafeRasterImage checks actual
    // file content below and is the real gate.
    if (!file.type.startsWith("image/")) {
      return { error: "That doesn't look like an image" };
    }
    const input = Buffer.from(await file.arrayBuffer());
    if (!isSafeRasterImage(input)) {
      return { error: "Unsupported image format — use JPEG, PNG, GIF, or WebP" };
    }
    try {
      avatarImage = await processAvatarImage(input);
    } catch {
      return { error: "Couldn't read that image — try a different file" };
    }
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      avatarShape: parsed.data.avatarShape,
      avatarEnabled: parsed.data.avatarEnabled,
      // Prisma's Bytes field wants a plain Uint8Array<ArrayBuffer>; Node's
      // Buffer type is generic over ArrayBufferLike (incl. SharedArrayBuffer),
      // which doesn't structurally match.
      ...(avatarImage ? { avatarImage: new Uint8Array(avatarImage) } : {}),
    },
  });

  revalidateSettings(profile.username);
  return { ok: true };
}

export async function removeAvatarImage(): Promise<void> {
  const { profile } = await requireProfile();
  await prisma.profile.update({
    where: { id: profile.id },
    data: { avatarImage: null },
  });
  revalidateSettings(profile.username);
}
