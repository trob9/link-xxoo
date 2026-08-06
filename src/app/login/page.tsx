import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { discordSignIn, googleSignIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const destination = safeRedirectPath(callbackUrl);

  const session = await auth();
  if (session?.user) redirect(destination);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Panel className="w-full max-w-md animate-rise-in p-8 text-center">
        <p className="font-display text-3xl font-semibold text-ink">
          link.xxoo.ooo
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          One link for everything you make. Sign in to build yours.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <form action={discordSignIn}>
            <input type="hidden" name="callbackUrl" value={destination} />
            <Button type="submit" className="w-full">
              Continue with Discord
            </Button>
          </form>

          <form action={googleSignIn}>
            <input type="hidden" name="callbackUrl" value={destination} />
            <Button type="submit" variant="secondary" className="w-full">
              Continue with Google
            </Button>
          </form>
        </div>

        {/*
          Each provider is its own account. Saying so here is cheaper than
          fielding "where did my links go" from someone who signed up with
          Discord and later clicked Google.
        */}
        <p className="mt-5 text-xs text-ink-muted">
          Discord and Google sign-ins are separate accounts. Use the same one
          each time to reach your page.
        </p>

        <p className="mt-4 text-xs text-ink-muted">
          By signing in you agree to the{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-ink"
          >
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-ink"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </Panel>
    </main>
  );
}
