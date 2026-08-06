import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { linkVisibilityWhere } from "@/lib/links";
import { AVATAR_SHAPE_RADIUS, type AvatarShape } from "@/lib/avatar-shape";
import {
  parseStoredThemeConfig,
  resolveThemeConfig,
  DISPLAY_FONT_STACK,
} from "@/lib/themes";
import LinkButton from "./_components/LinkButton";
import SensitiveGate from "./_components/SensitiveGate";
import SaveContact from "./_components/SaveContact";
import SocialIcons from "./_components/SocialIcons";
import ViewBeacon from "./_components/ViewBeacon";

// Past this many links the entrance delay stops growing — see the comment at
// the render site below.
const STAGGER_CAP = 9;

// generateMetadata only needs scalar profile fields — deliberately lighter
// than the display query below, which joins links/socialLinks.
const getProfileMeta = cache((username: string) =>
  prisma.profile.findUnique({
    where: { username },
    select: {
      displayName: true,
      bio: true,
      seoTitle: true,
      seoDescription: true,
      avatarUrl: true,
      // Needed by resolveAvatarSrc below so the unfurl picks up an uploaded
      // picture, not just the Discord one.
      id: true,
      username: true,
      avatarEnabled: true,
      updatedAt: true,
    },
  }),
);

const getProfileForDisplay = cache(async (username: string) => {
  const now = new Date();
  return prisma.profile.findUnique({
    where: { username },
    // avatarImage is a binary blob — fetched separately as a byte count
    // check below, never loaded into this query.
    omit: { avatarImage: true },
    include: {
      links: {
        where: linkVisibilityWhere(now),
        orderBy: [{ featured: "desc" }, { order: "asc" }],
      },
      socialLinks: { orderBy: { order: "asc" } },
    },
  });
});

type ProfileCSSVars = React.CSSProperties & {
  [key: `--pt-${string}`]: string;
};

// Which picture to show: a user upload wins over the Discord-provided one,
// and "avatar disabled" beats both. The upload is a blob column, so its
// presence is a COUNT rather than a fetch — the bytes only ever leave the
// database through the /api/avatar route. The updatedAt stamp in the path is
// the cache-buster.
const resolveAvatarSrc = cache(
  async (profile: {
    id: string;
    username: string;
    avatarEnabled: boolean;
    avatarUrl: string | null;
    updatedAt: Date;
  }): Promise<string | null> => {
    if (!profile.avatarEnabled) return null;

    const hasUpload =
      (await prisma.profile.count({
        where: { id: profile.id, avatarImage: { not: null } },
      })) > 0;

    return hasUpload
      ? `/api/avatar/${profile.username}/${profile.updatedAt.getTime()}`
      : profile.avatarUrl;
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileMeta(username);
  if (!profile) return { title: "Profile not found" };

  const title = profile.seoTitle || profile.displayName;
  const description = profile.seoDescription || profile.bio || undefined;

  // A link-in-bio page mostly travels by being pasted into a chat, so the
  // unfurl IS the first impression. This previously only ever offered the
  // Discord avatar, which meant anyone who uploaded their own picture
  // unfurled with no image at all.
  const image = await resolveAvatarSrc(profile);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/${username}`,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary" : "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileForDisplay(username);
  if (!profile) notFound();

  const avatarSrc = await resolveAvatarSrc(profile);
  const avatarRadius = AVATAR_SHAPE_RADIUS[profile.avatarShape as AvatarShape];

  const theme = resolveThemeConfig(
    profile.themePreset,
    parseStoredThemeConfig(profile.themeConfig),
  );

  const emailSocial = profile.socialLinks.find((s) => s.platform === "email");

  const containerStyle: ProfileCSSVars = {
    "--pt-bg": theme.background,
    "--pt-surface": theme.surface,
    "--pt-ink": theme.ink,
    "--pt-ink-muted": theme.inkMuted,
    "--pt-accent": theme.accent,
    "--pt-accent-ink": theme.accentInk,
    fontFamily: DISPLAY_FONT_STACK[theme.displayFont],
    // backgroundColor, NOT the `background` shorthand: this is an inline
    // style, so it outranks the stylesheet, and the shorthand would reset
    // background-image — wiping the [data-pattern] texture entirely.
    backgroundColor: "var(--pt-bg)",
    color: "var(--pt-ink)",
  };

  const body = (
    <div className="mt-8 flex flex-col items-stretch gap-3">
      {profile.bio && (
        <p
          className="mb-2 text-center"
          style={{ color: "var(--pt-ink-muted)", fontSize: 15 }}
        >
          {profile.bio}
        </p>
      )}

      {/*
        Links cascade in one after another rather than the whole block
        fading up at once. The delay is capped at STAGGER_CAP steps so a
        profile with thirty links doesn't leave the last one hanging for a
        second and a half.
      */}
      {profile.links.map((link, index) => (
        <LinkButton
          key={link.id}
          id={link.id}
          title={link.title}
          url={link.url}
          icon={link.icon}
          featured={link.featured}
          buttonStyle={theme.buttonStyle}
          index={Math.min(index, STAGGER_CAP)}
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
    <div
      data-profile
      data-pattern={theme.backgroundPattern}
      className="min-h-screen"
      style={containerStyle}
    >
      <ViewBeacon username={profile.username} />
      <div className="mx-auto w-full max-w-[560px] px-5 py-14">
        <header className="animate-rise-in flex flex-col items-center gap-4 text-center">
          {profile.avatarEnabled &&
            (avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={profile.displayName}
                width={104}
                height={104}
                className="object-cover"
                style={{
                  border: "2px solid var(--pt-ink)",
                  borderRadius: avatarRadius,
                }}
              />
            ) : (
              <div
                aria-hidden
                className="flex items-center justify-center"
                style={{
                  width: 104,
                  height: 104,
                  fontSize: 40,
                  fontWeight: 700,
                  background: "var(--pt-surface)",
                  color: "var(--pt-ink)",
                  border: "2px solid var(--pt-ink)",
                  borderRadius: avatarRadius,
                }}
              >
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            ))}

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
