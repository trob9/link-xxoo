import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  resolveThemeConfig,
  DISPLAY_FONT_STACK,
  type ThemeConfig,
} from "@/lib/themes";
import LinkButton from "./_components/LinkButton";
import SensitiveGate from "./_components/SensitiveGate";
import SaveContact from "./_components/SaveContact";
import SocialIcons from "./_components/SocialIcons";

async function getProfile(username: string) {
  return prisma.profile.findUnique({
    where: { username },
    include: {
      links: { orderBy: { order: "asc" } },
      socialLinks: { orderBy: { order: "asc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "Profile not found" };

  const title = profile.seoTitle || profile.displayName;
  const description = profile.seoDescription || profile.bio || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl] : undefined,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const theme = resolveThemeConfig(
    profile.themePreset,
    profile.themeConfig
      ? (JSON.parse(profile.themeConfig) as Partial<ThemeConfig>)
      : null,
  );

  // Server Component: runs once per request on the server, not subject to
  // the client re-render purity rules this lint rule otherwise rightly enforces.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const visibleLinks = profile.links
    .filter(
      (link) =>
        link.enabled &&
        (!link.startsAt || link.startsAt.getTime() <= now) &&
        (!link.endsAt || link.endsAt.getTime() >= now),
    )
    .sort((a, b) => Number(b.featured) - Number(a.featured));

  const emailSocial = profile.socialLinks.find((s) => s.platform === "email");

  const containerStyle = {
    ["--pt-bg" as keyof React.CSSProperties]: theme.background,
    ["--pt-surface" as keyof React.CSSProperties]: theme.surface,
    ["--pt-ink" as keyof React.CSSProperties]: theme.ink,
    ["--pt-ink-muted" as keyof React.CSSProperties]: theme.inkMuted,
    ["--pt-accent" as keyof React.CSSProperties]: theme.accent,
    ["--pt-accent-ink" as keyof React.CSSProperties]: theme.accentInk,
    fontFamily: DISPLAY_FONT_STACK[theme.displayFont],
    background: "var(--pt-bg)",
    color: "var(--pt-ink)",
  } as React.CSSProperties;

  const body = (
    <div className="animate-rise-in mt-8 flex flex-col items-stretch gap-3">
      {profile.bio && (
        <p
          className="mb-2 text-center"
          style={{ color: "var(--pt-ink-muted)", fontSize: 15 }}
        >
          {profile.bio}
        </p>
      )}

      {visibleLinks.map((link) => (
        <LinkButton
          key={link.id}
          id={link.id}
          title={link.title}
          url={link.url}
          featured={link.featured}
          buttonStyle={theme.buttonStyle}
        />
      ))}

      <SocialIcons socials={profile.socialLinks} />

      <div className="mt-2 flex justify-center">
        <SaveContact
          username={profile.username}
          displayName={profile.displayName}
          bio={profile.bio}
          email={emailSocial?.url ?? null}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={containerStyle}>
      <div className="mx-auto w-full max-w-[560px] px-5 py-14">
        <header className="animate-rise-in flex flex-col items-center gap-4 text-center">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName}
              width={104}
              height={104}
              className="rounded-full object-cover"
              style={{ border: "2px solid var(--pt-ink)" }}
            />
          ) : (
            <div
              aria-hidden
              className="flex items-center justify-center rounded-full"
              style={{
                width: 104,
                height: 104,
                fontSize: 40,
                fontWeight: 700,
                background: "var(--pt-surface)",
                color: "var(--pt-ink)",
                border: "2px solid var(--pt-ink)",
              }}
            >
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <h1 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>
            {profile.displayName}
          </h1>
        </header>

        {profile.sensitiveContent ? (
          <SensitiveGate>{body}</SensitiveGate>
        ) : (
          body
        )}
      </div>
    </div>
  );
}
