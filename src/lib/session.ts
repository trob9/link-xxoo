import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// cache() dedupes within a single request — a layout and its page(s) each
// calling requireProfile() only costs one auth() + one profile query, not
// one per call site.
export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
});

export const requireProfile = cache(async () => {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { user: { select: { discordAvatar: true } } },
    // avatarImage is a binary blob — every dashboard page calls
    // requireProfile(), but only the settings page needs the image bytes,
    // which it fetches itself. Leaving it out here keeps the common path lean.
    omit: { avatarImage: true },
  });
  if (!profile) redirect("/onboarding");
  return { user, profile };
});
