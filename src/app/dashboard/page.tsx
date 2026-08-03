import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { AddLinkForm } from "./_components/AddLinkForm";
import { LinksManager, type DashboardLink } from "./_components/LinksManager";

export default async function DashboardPage() {
  const { profile } = await requireProfile();

  const links = await prisma.link.findMany({
    where: { profileId: profile.id },
    orderBy: { order: "asc" },
  });

  const data: DashboardLink[] = links.map((link) => ({
    id: link.id,
    title: link.title,
    url: link.url,
    icon: link.icon,
    enabled: link.enabled,
    featured: link.featured,
    clickCount: link.clickCount,
    startsAt: link.startsAt ? link.startsAt.toISOString() : null,
    endsAt: link.endsAt ? link.endsAt.toISOString() : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Your links</h1>
          <p className="text-sm text-ink-muted">
            Drag to reorder — the order here is the order on your public page.
          </p>
        </div>
        <span className="font-stat text-sm text-ink-muted">
          {data.length} {data.length === 1 ? "link" : "links"}
        </span>
      </header>

      <AddLinkForm />

      <LinksManager links={data} />
    </div>
  );
}
