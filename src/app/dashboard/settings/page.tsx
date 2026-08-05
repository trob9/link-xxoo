import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { Panel } from "@/components/ui/panel";
import { SettingsForm } from "../_components/SettingsForm";
import { AvatarUploader } from "../_components/AvatarUploader";
import type { AvatarShape } from "@/lib/avatar-shape";
import {
  SocialLinksManager,
  type DashboardSocial,
} from "../_components/SocialLinksManager";

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

  const socialLinks = await prisma.socialLink.findMany({
    where: { profileId: profile.id },
    orderBy: { order: "asc" },
  });

  const socials: DashboardSocial[] = socialLinks.map((s) => ({
    id: s.id,
    platform: s.platform,
    url: s.url,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-sm text-ink-muted">
          Profile details, SEO, and the social icons on your page.
        </p>
      </header>

      <Panel className="flex flex-col gap-4">
        <h2 className="font-display text-xl">Profile</h2>
        <SettingsForm
          displayName={profile.displayName}
          bio={profile.bio}
          seoTitle={profile.seoTitle}
          seoDescription={profile.seoDescription}
          sensitiveContent={profile.sensitiveContent}
        />
      </Panel>

      <Panel className="flex flex-col gap-4">
        <h2 className="font-display text-xl">Profile picture</h2>
        <AvatarUploader
          displayName={profile.displayName}
          currentSrc={avatarSrc}
          hasCustomImage={hasCustomAvatar}
          initialShape={profile.avatarShape as AvatarShape}
          initialEnabled={profile.avatarEnabled}
        />
      </Panel>

      <Panel className="flex flex-col gap-4">
        <h2 className="font-display text-xl">Social links</h2>
        <SocialLinksManager socials={socials} />
      </Panel>
    </div>
  );
}
