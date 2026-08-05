import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { Panel } from "@/components/ui/panel";
import { SettingsForm } from "../_components/SettingsForm";
import { AvatarUploader } from "../_components/AvatarUploader";
import type { AvatarShape } from "@/lib/avatar-shape";

export default async function SettingsPage() {
  const { profile } = await requireProfile();

  // Cheap existence check (COUNT, not a fetch) — the actual bytes are only
  // ever loaded by the /api/avatar route handler that serves them.
  const hasCustomAvatar =
    (await prisma.profile.count({
      where: { id: profile.id, avatarImage: { not: null } },
    })) > 0;

  const avatarSrc = hasCustomAvatar
    ? `/api/avatar/${profile.username}/${profile.updatedAt.getTime()}`
    : profile.avatarUrl;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-sm text-ink-muted">
          Who you are, how you&rsquo;re found, and who gets to see your page.
        </p>
      </header>

      {/*
        Grouped by the question each block answers rather than by which
        database column it writes. Social icons used to live down here as a
        third panel — they're content that shows on the public page, so they
        moved next to the links.
      */}
      <Panel className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl">Profile picture</h2>
          <p className="text-sm text-ink-muted">
            Shown at the top of your public page.
          </p>
        </div>
        <AvatarUploader
          displayName={profile.displayName}
          currentSrc={avatarSrc}
          hasCustomImage={hasCustomAvatar}
          initialShape={profile.avatarShape as AvatarShape}
          initialEnabled={profile.avatarEnabled}
        />
      </Panel>

      <Panel className="flex flex-col gap-4">
        <SettingsForm
          displayName={profile.displayName}
          bio={profile.bio}
          seoTitle={profile.seoTitle}
          seoDescription={profile.seoDescription}
          sensitiveContent={profile.sensitiveContent}
        />
      </Panel>
    </div>
  );
}
