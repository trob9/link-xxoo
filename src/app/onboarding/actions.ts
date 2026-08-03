"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { usernameSchema } from "@/lib/validation";

export type ClaimState = { error?: string };

export async function claimUsername(
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const user = await requireUser();

  const parsed = usernameSchema.safeParse(formData.get("username"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid username" };
  }
  const username = parsed.data;

  try {
    await prisma.profile.create({
      data: {
        userId: user.id,
        username,
        displayName: user.name ?? username,
        avatarUrl: user.image ?? null,
        themePreset: "dawn",
      },
    });
  } catch (error) {
    // P2002: unique constraint violation — someone else claimed this
    // username (or this user already has a profile) between our check and
    // the write. Report it as a normal form error, not a crash.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: "That username is already taken" };
    }
    throw error;
  }

  redirect("/dashboard");
}
