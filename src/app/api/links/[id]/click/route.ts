import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const referrer = request.headers.get("referer");
  const now = new Date();

  try {
    // Scope to links that are currently visible on the public page (same
    // enabled/schedule predicate as src/app/[username]/page.tsx) so a link
    // that's been disabled or scheduled out can't still rack up clicks via
    // a direct POST to a previously-seen link id.
    const { count } = await prisma.link.updateMany({
      where: {
        id,
        enabled: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      data: { clickCount: { increment: 1 } },
    });

    if (count > 0) {
      await prisma.clickEvent.create({
        data: { linkId: id, referrer: referrer ?? null },
      });
    }
  } catch {
    return new Response(null, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
