import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { linkVisibilityWhere } from "@/lib/links";
import { Panel } from "@/components/ui/panel";

const WINDOW_DAYS = 14;

// Server-local calendar day. The window below is built with setHours(0,0,0,0)
// — also server-local — so the bucket keys and the window have to agree;
// keying with toISOString() (UTC) put them a day apart on any host that isn't
// on UTC.
function dayKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function bucketByDay(dates: { createdAt: Date }[]): Record<string, number> {
  return dates.reduce<Record<string, number>>((acc, e) => {
    const key = dayKey(e.createdAt);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export default async function AnalyticsPage() {
  const { profile } = await requireProfile();

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - (WINDOW_DAYS - 1));
  windowStart.setHours(0, 0, 0, 0);

  const [links, clickEvents, viewEvents, liveLinkCount, totalViews] =
    await Promise.all([
      prisma.link.findMany({
        where: { profileId: profile.id },
        orderBy: { clickCount: "desc" },
        select: { id: true, title: true, clickCount: true },
      }),
      prisma.clickEvent.findMany({
        where: {
          link: { profileId: profile.id },
          createdAt: { gte: windowStart },
        },
        select: { createdAt: true },
      }),
      prisma.profileView.findMany({
        where: { profileId: profile.id, createdAt: { gte: windowStart } },
        select: { createdAt: true },
      }),
      // "Live" has to mean what the public page means by it — enabled AND
      // inside its schedule window — so it goes through the same predicate
      // the profile page uses rather than counting every row.
      prisma.link.count({
        where: { profileId: profile.id, ...linkVisibilityWhere(new Date()) },
      }),
      prisma.profileView.count({ where: { profileId: profile.id } }),
    ]);

  const clicksByDay = bucketByDay(clickEvents);
  const viewsByDay = bucketByDay(viewEvents);

  const days: {
    key: string;
    label: string;
    clicks: number;
    views: number;
  }[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = dayKey(d);
    days.push({
      key,
      label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
      clicks: clicksByDay[key] ?? 0,
      views: viewsByDay[key] ?? 0,
    });
  }

  const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
  const maxClickCount = Math.max(1, ...links.map((l) => l.clickCount));
  const maxDayCount = Math.max(1, ...days.map((d) => Math.max(d.clicks, d.views)));

  // Click-through rate over all time. Clicks can exceed views (one visitor,
  // several links), so this is deliberately not capped at 100%.
  const ctr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : null;

  const hasAnyData = totalViews > 0 || totalClicks > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Analytics</h1>
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Views" value={totalViews} />
        <Stat label="Clicks" value={totalClicks} />
        <Stat
          label="Click rate"
          value={ctr === null ? "—" : `${ctr}%`}
          hint={ctr === null ? "No views yet" : undefined}
        />
        <Stat label="Live links" value={liveLinkCount} />
      </div>

      <Panel className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-xl">Last {WINDOW_DAYS} days</h2>
          <p className="flex items-center gap-4 text-xs text-ink-muted">
            <LegendKey className="bg-surface-raised">Views</LegendKey>
            <LegendKey className="bg-accent-secondary">Clicks</LegendKey>
          </p>
        </div>

        {hasAnyData ? (
          <div className="mt-6 flex h-40 items-end gap-2">
            {days.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                {/*
                  Views sit behind clicks in the same column rather than in a
                  second chart: the interesting quantity is the gap between
                  them, and two separate charts make that a memory exercise.
                */}
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full border-hard bg-surface-raised"
                    style={{ height: `${barHeight(d.views, maxDayCount)}%` }}
                    title={`${d.key}: ${d.views} views`}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 border-hard bg-accent-secondary"
                    style={{ height: `${barHeight(d.clicks, maxDayCount)}%` }}
                    title={`${d.key}: ${d.clicks} clicks`}
                  />
                </div>
                <span className="font-stat text-[10px] text-ink-muted">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>
            Nothing yet. Share your page and the numbers start here.
          </EmptyState>
        )}
      </Panel>

      <Panel className="p-6">
        <h2 className="font-display text-xl">Top links</h2>
        {links.length === 0 ? (
          <EmptyState>
            <Link href="/dashboard" className="underline underline-offset-4">
              Add your first link
            </Link>{" "}
            to start tracking clicks.
          </EmptyState>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {links.map((link) => (
              <li key={link.id} className="flex items-center gap-4">
                <span className="w-32 shrink-0 truncate text-sm font-semibold text-ink sm:w-40">
                  {link.title}
                </span>
                <div className="h-6 flex-1 border-hard bg-surface-raised">
                  <div
                    className="h-full bg-action-primary transition-[width] duration-500"
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

// A zero-count day still gets a sliver so the axis reads as a row of days
// rather than a gap.
function barHeight(count: number, max: number): number {
  if (count === 0) return 2;
  return Math.max((count / max) * 100, 6);
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <Panel className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-stat text-3xl font-bold text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
    </Panel>
  );
}

function LegendKey({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={`inline-block h-3 w-3 border-2 border-border-strong ${className}`}
      />
      {children}
    </span>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 rounded-md border-2 border-dashed border-border-strong p-6 text-center text-sm text-ink-muted">
      {children}
    </p>
  );
}
