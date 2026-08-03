import { signOut } from "@/auth";
import { requireProfile } from "@/lib/session";
import { DashboardNav } from "./_components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireProfile();

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
      <aside className="md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-64 md:shrink-0">
        <div className="h-full rounded-md border-hard bg-surface p-4 shadow-hard md:p-5">
          <DashboardNav
            username={profile.username}
            displayName={profile.displayName}
            avatarUrl={profile.user.discordAvatar ?? null}
            signOutAction={doSignOut}
          />
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
