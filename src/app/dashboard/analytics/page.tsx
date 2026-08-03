import { requireProfile } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Panel } from "@/components/ui/panel";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export default async function AnalyticsPage() {
  const { profile } = await requireProfile();

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  // Independent queries (both only need profile.id) — run concurrently.
  const [links, events] = await Promise.all([
    prisma.link.findMany({
      where: { profileId: profile.id },
      orderBy: { clickCount: "desc" },
      select: { id: true, title: true, clickCount: true },
    }),
    prisma.clickEvent.findMany({
      where: {
        link: { profileId: profile.id },
        createdAt: { gte: fourteenDaysAgo },
      },
      select: { createdAt: true },
    }),
  ]);

  const counts = events.reduce<Record<string, number>>((acc, e) => {
    const key = dayKey(e.createdAt);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const days: { key: string; label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = dayKey(d);
    days.push({
      key,
      label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
      count: counts[key] ?? 0,
    });
  }

  const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
  const maxClickCount = Math.max(1, ...links.map((l) => l.clickCount));
  const maxDayCount = Math.max(1, ...days.map((d) => d.count));
  const last14Total = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            How your links are performing.
          </p>
        </div>
        <a
          href="/api/qr"
          download
          className="inline-flex items-center justify-center gap-2 rounded-md border-hard bg-surface-raised px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ink shadow-hard press-hard"
        >
          Download QR code
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Panel className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Total clicks
          </p>
          <p className="mt-1 font-stat text-3xl font-bold text-ink">
            {totalClicks}
          </p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Last 14 days
          </p>
          <p className="mt-1 font-stat text-3xl font-bold text-ink">
            {last14Total}
          </p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Live links
          </p>
          <p className="mt-1 font-stat text-3xl font-bold text-ink">
            {links.length}
          </p>
        </Panel>
      </div>

      <Panel className="p-6">
        <h2 className="font-display text-xl font-semibold text-ink">
          Clicks, last 14 days
        </h2>
        <div className="mt-6 flex h-40 items-end gap-2">
          {days.map((d) => (
            <div
              key={d.key}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full border-hard bg-accent-secondary"
                  style={{
                    height: `${Math.max((d.count / maxDayCount) * 100, d.count > 0 ? 6 : 2)}%`,
                  }}
                  title={`${d.key}: ${d.count} clicks`}
                />
              </div>
              <span className="font-stat text-[10px] text-ink-muted">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <h2 className="font-display text-xl font-semibold text-ink">
          Top links
        </h2>
        {links.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            No links yet. Add some from your dashboard to start tracking clicks.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {links.map((link) => (
              <li key={link.id} className="flex items-center gap-4">
                <span className="w-40 shrink-0 truncate text-sm font-semibold text-ink">
                  {link.title}
                </span>
                <div className="h-6 flex-1 border-hard bg-surface-raised">
                  <div
                    className="h-full bg-action-primary"
                    style={{
                      width: `${(link.clickCount / maxClickCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right font-stat text-sm font-bold text-ink">
                  {link.clickCount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
