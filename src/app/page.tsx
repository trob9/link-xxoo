import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { discordSignIn } from "./login/actions";

const features = [
  {
    title: "Unlimited links",
    body: "Add every link you have. No caps, no upsell to unlock the fifth row.",
  },
  {
    title: "Link scheduling",
    body: "Set a start and end time. A link goes live for the drop, then hides itself.",
  },
  {
    title: "Views and clicks",
    body: "Visits, taps, and the click rate between them — two weeks at a glance.",
  },
  {
    title: "Themes you design",
    body: "Every colour, font and button style. Save as many as you like, for free.",
  },
  {
    title: "One-tap Discord sign-in",
    body: "No password to invent or forget. Sign in with the account you already use.",
  },
  {
    title: "QR export",
    body: "Download a print-ready QR code for your page and stick it anywhere.",
  },
];

export default async function Home() {
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-semibold text-ink">
          link.xxoo.ooo
        </span>
        {signedIn ? (
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Dashboard
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
        )}
      </header>

      <section className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl">
            Everything you make, behind one link.
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-muted">
            A single page for your links, shops, and socials — built to be fast,
            yours, and impossible to mistake for a template.
          </p>

          <div className="mt-8">
            {signedIn ? (
              <Link href="/dashboard">
                <Button size="md">Go to dashboard</Button>
              </Link>
            ) : (
              <form action={discordSignIn}>
                <input type="hidden" name="callbackUrl" value="/dashboard" />
                <Button type="submit" size="md">
                  Continue with Discord
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="relative hidden md:block" aria-hidden>
          <div className="mx-auto w-full max-w-xs border-hard shadow-hard bg-surface-raised p-5">
            <div className="mx-auto h-16 w-16 border-hard bg-action-primary" />
            <div className="mx-auto mt-3 h-3 w-24 bg-ink" />
            <div className="mx-auto mt-2 h-2 w-32 bg-ink-muted" />
            <div className="mt-6 space-y-3">
              <div className="h-10 border-hard shadow-hard-sm bg-surface" />
              <div className="h-10 border-hard shadow-hard-sm bg-accent-secondary" />
              <div className="h-10 border-hard shadow-hard-sm bg-surface" />
              <div className="h-10 border-hard shadow-hard-sm bg-surface" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t-2 border-border-strong bg-surface">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="font-display text-3xl font-semibold text-ink">
            What you get
          </h2>
          {/*
            A ruled list, not a grid of identical bordered cards. Same words,
            but the reading order is unambiguous and it doesn't look like
            every other landing page assembled out of the same component kit.
          */}
          <dl className="mt-10 grid gap-x-12 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="border-t-2 border-border-strong py-5"
              >
                <dt className="font-display text-lg font-semibold text-ink">
                  {f.title}
                </dt>
                <dd className="mt-1.5 max-w-sm text-sm text-ink-muted">
                  {f.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="border-t-2 border-border-strong">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-ink-muted">
          <span className="font-display font-semibold text-ink">
            link.xxoo.ooo
          </span>
          <span>One link. Everything you make.</span>
        </div>
      </footer>
    </main>
  );
}
