import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { AddLinkForm } from "./_components/AddLinkForm";
import { LinksManager, type DashboardLink } from "./_components/LinksManager";
import {
  SocialLinksManager,
  type DashboardSocial,
} from "./_components/SocialLinksManager";

// Featuring everything is the same as featuring nothing: the public page
// sorts featured links to the top, so once most of them are starred the sort
// stops meaning anything and the heavier styling stops standing out.
const FEATURED_SOFT_LIMIT = 3;

export default async function DashboardPage() {
  const { profile } = await requireProfile();

  const [links, socialLinks] = await Promise.all([
    prisma.link.findMany({
      where: { profileId: profile.id },
      orderBy: { order: "asc" },
    }),
    prisma.socialLink.findMany({
      where: { profileId: profile.id },
      orderBy: { order: "asc" },
    }),
  ]);

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

  const socials: DashboardSocial[] = socialLinks.map((s) => ({
    id: s.id,
    platform: s.platform,
    url: s.url,
  }));

  const featuredCount = data.filter((l) => l.featured).length;

  return (
    <div className="flex flex-col gap-10">
      {/*
        Sections run in the same order they appear on the public page — links,
        then the social icon row — so this screen reads as a map of the thing
        it edits rather than a pile of unrelated settings.
      */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Your links</h1>
            <p className="text-sm text-ink-muted">Drag to reorder.</p>
          </div>
          <span className="font-stat text-sm text-ink-muted">
            {data.length} {data.length === 1 ? "link" : "links"}
          </span>
        </header>

        <AddLinkForm />

        {featuredCount > FEATURED_SOFT_LIMIT ? (
          <p className="rounded-md border-hard bg-accent-secondary px-4 py-3 text-sm font-semibold text-accent-secondary-ink">
            {featuredCount} links featured — past about {FEATURED_SOFT_LIMIT},
            none of them stands out.
          </p>
        ) : null}

        <LinksManager links={data} />
      </section>

      <section className="flex flex-col gap-6">
        <header>
          <h2 className="font-display text-2xl">Social icons</h2>
          <p className="text-sm text-ink-muted">
            Shown under your links. Drag to reorder.
          </p>
        </header>

        <SocialLinksManager socials={socials} />
      </section>
    </div>
  );
}
