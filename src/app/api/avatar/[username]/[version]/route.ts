import { prisma } from "@/lib/prisma";

// [version] is an opaque cache-buster (the profile's updatedAt timestamp)
// baked into the path rather than a query string — Next 16 blocks query
// strings on local next/image sources by default (anti-enumeration), and
// its `search` match is exact-only, which can't work for a per-upload
// timestamp anyway. Not used for lookup, just makes the URL change when
// the image does so it can be cached "forever".
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string; version: string }> },
) {
  const { username } = await params;

  const profile = await prisma.profile.findUnique({
    where: { username },
    select: { avatarImage: true },
  });

  if (!profile?.avatarImage) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(profile.avatarImage), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      // Belt-and-suspenders: the stored bytes are always our own re-encoded
      // WebP output, never a passthrough of user-uploaded bytes, but this
      // stops a browser from ever MIME-sniffing this response as anything
      // other than what Content-Type declares.
      "X-Content-Type-Options": "nosniff",
    },
  });
}
