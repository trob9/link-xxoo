import { SocialIcon } from "@/components/social-icon";
import { socialIconStyle } from "@/lib/social-icon-style";

type Social = { id: string; platform: string; url: string };

export default function SocialIcons({ socials }: { socials: Social[] }) {
  if (socials.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
      {socials.map((s) => {
        const isEmail = s.platform === "email";
        const href = isEmail ? `mailto:${s.url}` : s.url;
        return (
          <a
            key={s.id}
            href={href}
            aria-label={s.platform}
            {...(isEmail
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
            style={socialIconStyle({
              surface: "var(--pt-surface)",
              ink: "var(--pt-ink)",
            })}
          >
            <SocialIcon platform={s.platform} />
          </a>
        );
      })}
    </div>
  );
}
