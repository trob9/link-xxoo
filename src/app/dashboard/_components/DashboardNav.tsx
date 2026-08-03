"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Links" },
  { href: "/dashboard/theme", label: "Theme" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function DashboardNav({
  username,
  displayName,
  avatarUrl,
  signOutAction,
}: {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const initials = displayName.trim().slice(0, 2).toUpperCase() || "??";

  return (
    <nav className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md border-hard bg-surface-raised text-sm font-bold">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base leading-tight">
            {displayName}
          </p>
          <p className="truncate text-xs text-ink-muted">@{username}</p>
        </div>
      </div>

      <ul className="flex flex-row gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0 md:shrink">
              <Link
                href={item.href}
                className={cn(
                  "block rounded-md border-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors",
                  active
                    ? "border-border-strong bg-action-primary text-action-primary-ink shadow-hard-sm"
                    : "border-transparent text-ink hover:border-border-strong",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <a
          href={`/${username}`}
          target="_blank"
          rel="noreferrer"
          className="block rounded-md border-hard bg-accent-secondary px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-accent-secondary-ink shadow-hard-sm press-hard"
        >
          View live page ↗
        </a>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" size="sm" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </nav>
  );
}
