import type { Prisma } from "@/generated/prisma/client";

// The "is this link currently visible?" rule (enabled + within its
// schedule window, if any) — shared by the click-tracking route and the
// public profile page's query, so the two can't silently drift apart.
export function linkVisibilityWhere(now: Date): Prisma.LinkWhereInput {
  return {
    enabled: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}
