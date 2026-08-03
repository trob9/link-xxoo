import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Panel } from "@/components/ui/panel";
import { ClaimForm } from "./_components/claim-form";

export default async function OnboardingPage() {
  const user = await requireUser();

  const existing = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (existing) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Panel className="w-full max-w-lg animate-rise-in p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">
          Claim your link
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          This is your public address — the one link you put everywhere. You can
          change everything else later, but pick a name you like.
        </p>
        <ClaimForm />
      </Panel>
    </main>
  );
}
