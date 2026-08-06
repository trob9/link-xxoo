import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/legal";

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

/**
 * The site chrome's footer. Deliberately not rendered on public profile
 * pages ([username]) — those are the owner's own themed surface, and site
 * links in the site's palette would sit on top of their design.
 */
export function SiteFooter() {
  return (
    <footer className="border-t-2 border-border-strong">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-display font-semibold text-ink">
            {SITE_NAME}
          </span>
          <span>One link. Everything you make.</span>
        </div>

        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="underline underline-offset-4 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-4 hover:text-ink"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
