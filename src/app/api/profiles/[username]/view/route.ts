import { prisma } from "@/lib/prisma";

/**
 * Records one view of a public profile.
 *
 * Fired from the browser rather than counted during server render, because
 * the page is also rendered for link-unfurl bots and route prefetches — both
 * of which would inflate the number without a human ever seeing the page.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const profile = await prisma.profile.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!profile) return new Response(null, { status: 404 });

  await prisma.profileView.create({ data: { profileId: profile.id } });
  return new Response(null, { status: 204 });
}
