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

  const existing = await prisma.profile.findUnique({ where: { username } });
  if (existing) {
    return { error: "That username is already taken" };
  }

  await prisma.profile.create({
    data: {
      userId: user.id,
      username,
      displayName: user.name ?? username,
      avatarUrl: user.image ?? null,
      themePreset: "dawn",
    },
  });

  redirect("/dashboard");
}
