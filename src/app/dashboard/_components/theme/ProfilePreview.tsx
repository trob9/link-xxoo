"use client";

import { buttonStyleVariant } from "@/lib/button-style";
import { socialIconStyle } from "@/lib/social-icon-style";
import { SocialIcon } from "@/components/social-icon";
import { AVATAR_SHAPE_RADIUS, type AvatarShape } from "@/lib/avatar-shape";
import { DISPLAY_FONT_STACK, type ThemeConfig } from "@/lib/themes";

type PreviewLink = { title: string; featured: boolean };

// The preview is a miniature, so the tiles are too — 32px against the live
// page's 42px, in proportion with the shrunken avatar and link rows.
const SOCIAL_TILE_SIZE = 32;

/**
 * A miniature of the real public page, drawn from the same
 * `buttonStyleVariant` and `[data-pattern]` rules the live page uses — so a
 * control that looks right here is right there. It shows the owner's own
 * name, picture, first few link titles and social icons rather than lorem
 * ipsum, because
 * the question being answered is "how does *my* page look".
 */
export function ProfilePreview({
  config,
  avatarShape,
  avatarSrc,
  avatarEnabled,
  displayName,
  bio,
  links,
  socials,
}: {
  config: ThemeConfig;
  avatarShape: AvatarShape;
  avatarSrc: string | null;
  avatarEnabled: boolean;
  displayName: string;
  bio: string | null;
  links: PreviewLink[];
  /** Platform names only — the preview draws glyphs, never real links. */
  socials: string[];
}) {
  const radius = AVATAR_SHAPE_RADIUS[avatarShape];
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      data-pattern={config.backgroundPattern}
      className="flex flex-col items-center overflow-hidden rounded-md border-2 border-border-strong px-5 py-7 shadow-hard-sm"
      style={
        {
          // backgroundColor, never the `background` shorthand — the shorthand
          // resets background-image, and that is what [data-pattern] draws
          // the texture with.
          backgroundColor: config.background,
          color: config.ink,
          fontFamily: DISPLAY_FONT_STACK[config.displayFont],
          "--pt-ink": config.ink,
        } as React.CSSProperties
      }
    >
      {avatarEnabled ? (
        <div
          aria-hidden
          className="grid place-items-center overflow-hidden"
          style={{
            width: 64,
            height: 64,
            borderRadius: radius,
            border: `2px solid ${config.ink}`,
            backgroundColor: config.surface,
            color: config.ink,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
      ) : null}

      <p
        className="mt-3 text-center text-lg font-bold leading-tight"
        style={{ color: config.ink }}
      >
        {displayName}
      </p>
      {bio ? (
        <p
          className="mt-1 line-clamp-2 text-center text-xs"
          style={{ color: config.inkMuted }}
        >
          {bio}
        </p>
      ) : null}

      <div className="mt-4 flex w-full max-w-[240px] flex-col gap-2.5">
        {links.map((link, index) => {
          const variant = buttonStyleVariant(config.buttonStyle, {
            accent: config.accent,
            accentInk: config.accentInk,
            ink: config.ink,
          });
          if (link.featured) {
            variant.border = `3px solid ${config.ink}`;
            if (config.buttonStyle !== "outline") {
              variant.boxShadow = `5px 5px 0 0 ${config.ink}`;
            }
          }
          return (
            <div
              key={`${link.title}-${index}`}
              className="flex items-center justify-center px-3 py-2 text-[13px] font-semibold"
              style={variant}
            >
              <span className="truncate">{link.title}</span>
            </div>
          );
        })}
      </div>

      {socials.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {socials.map((platform, index) => (
            <span
              key={`${platform}-${index}`}
              aria-hidden
              style={socialIconStyle(
                { surface: config.surface, ink: config.ink },
                SOCIAL_TILE_SIZE,
              )}
            >
              <SocialIcon platform={platform} />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
