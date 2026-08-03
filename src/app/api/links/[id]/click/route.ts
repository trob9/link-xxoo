import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const referrer = request.headers.get("referer");

  try {
    await prisma.$transaction([
      prisma.link.update({
        where: { id },
        data: { clickCount: { increment: 1 } },
      }),
      prisma.clickEvent.create({
        data: { linkId: id, referrer: referrer ?? null },
      }),
    ]);
  } catch {
    return new Response(null, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
