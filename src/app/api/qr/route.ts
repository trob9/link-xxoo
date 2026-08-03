import QRCode from "qrcode";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return new Response("No profile", { status: 404 });
  }

  const host = request.headers.get("host") ?? "link.xxoo.ooo";
  const protocol = host.includes("localhost") ? "http" : "https";
  const url = `${protocol}://${host}/${profile.username}`;

  const buffer = await QRCode.toBuffer(url, { width: 512, margin: 2 });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${profile.username}-qr.png"`,
    },
  });
}
