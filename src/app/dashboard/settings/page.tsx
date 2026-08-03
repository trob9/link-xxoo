import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { Panel } from "@/components/ui/panel";
import { SettingsForm } from "../_components/SettingsForm";
import {
  SocialLinksManager,
  type DashboardSocial,
} from "../_components/SocialLinksManager";

export default async function SettingsPage() {
  const { profile } = await requireProfile();

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
        <h2 className="font-display text-xl">Social links</h2>
        <SocialLinksManager socials={socials} />
      </Panel>
    </div>
  );
}
