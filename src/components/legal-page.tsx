import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { LEGAL_EFFECTIVE_DATE, SITE_NAME } from "@/lib/legal";

/**
 * Shell for /privacy and /terms. They're long-form reading, so this fixes a
 * narrow measure and leaves the neobrutalist chrome to the header rules —
 * a page of body copy inside hard-bordered cards is unreadable.
 */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold text-ink">
          {SITE_NAME}
        </Link>
      </header>

      <article className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 font-stat text-xs uppercase tracking-wide text-ink-muted">
          Effective {LEGAL_EFFECTIVE_DATE}
        </p>
        <p className="mt-6 text-lg text-ink-muted">{intro}</p>

        <div className="mt-4">{children}</div>
      </article>

      <SiteFooter />
    </main>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t-2 border-border-strong py-6">
      <h2 className="font-display text-xl font-semibold text-ink">{heading}</h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
