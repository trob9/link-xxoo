import Link from "next/link";
import { Panel } from "@/components/ui/panel";

// Reached mainly by mistyped usernames, so it says which thing is missing
// rather than just "404".
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Panel className="w-full max-w-md animate-rise-in p-8 text-center">
        <p className="font-stat text-sm text-ink-muted">404</p>
        <h1 className="mt-2 font-display text-3xl">No page here</h1>
        <p className="mt-3 text-sm text-ink-muted">
          That name isn&rsquo;t taken — or isn&rsquo;t spelled that way.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md border-hard bg-action-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-action-primary-ink shadow-hard press-hard"
        >
          Claim it
        </Link>
      </Panel>
    </main>
  );
}
