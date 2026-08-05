"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { ButtonStyle } from "@/lib/themes";
import { buttonStyleVariant } from "@/lib/button-style";

type Props = {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  featured: boolean;
  buttonStyle: ButtonStyle;
  index: number;
};

export default function LinkButton({
  id,
  title,
  url,
  icon,
  featured,
  buttonStyle,
  index,
}: Props) {
  const [pressed, setPressed] = useState(false);

  function fireBeacon() {
    const endpoint = `/api/links/${id}/click`;
    // Feature check for browsers old enough to lack sendBeacon; `navigator`
    // itself is always there, since this only runs from a pointer event.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint);
      return;
    }
    fetch(endpoint, { method: "POST", keepalive: true }).catch(() => {});
  }

  const base: CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 52,
    padding: "12px 22px",
    fontWeight: 600,
    fontSize: 16,
    textAlign: "center",
    textDecoration: "none",
    cursor: "pointer",
    transition: "transform 60ms ease, box-shadow 60ms ease",
  };

  const variant: CSSProperties = buttonStyleVariant(buttonStyle, {
    accent: "var(--pt-accent)",
    accentInk: "var(--pt-accent-ink)",
    ink: "var(--pt-ink)",
  });

  /*
    Featured links earn emphasis through physical presence rather than a
    bigger font or a louder colour: a heavier border and a deeper offset
    shadow read as "sitting further off the page". Every button stays the
    same height, so the vertical rhythm survives, and it reads across all
    three button styles — including "flat", which has no border of its own
    to thicken.
  */
  if (featured) {
    variant.border = "3px solid var(--pt-ink)";
    if (buttonStyle !== "outline") {
      variant.boxShadow = "6px 6px 0 0 var(--pt-ink)";
    }
  }

  // Press-down collapses whatever shadow the button has.
  const hasShadow = buttonStyle === "raised" || (featured && buttonStyle !== "outline");
  const pressDistance = featured ? 6 : 4;
  if (hasShadow && pressed) {
    variant.boxShadow = "none";
    variant.transform = `translate(${pressDistance}px, ${pressDistance}px)`;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={fireBeacon}
      onPointerDown={() => hasShadow && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className="animate-rise-in-stagger"
      style={{ ...base, ...variant, "--i": index } as CSSProperties}
    >
      {icon ? (
        <span aria-hidden className="mr-2">
          {icon}
        </span>
      ) : null}
      <span>{title}</span>
    </a>
  );
}
