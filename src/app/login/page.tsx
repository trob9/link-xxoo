import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { discordSignIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const destination = callbackUrl || "/dashboard";

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

        <form action={discordSignIn} className="mt-8">
          <input type="hidden" name="callbackUrl" value={destination} />
          <Button type="submit" className="w-full">
            Continue with Discord
          </Button>
        </form>
      </Panel>
    </main>
  );
}
