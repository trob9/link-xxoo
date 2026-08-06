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
  const [hovered, setHovered] = useState(false);

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
    // Press is near-instant so the button feels physically connected to the
    // finger; hover is slower so the lift reads as a movement rather than a
    // jump. One duration for both would have to compromise on one of them.
    transition: pressed
      ? "transform 60ms ease, box-shadow 60ms ease"
      : "transform 140ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 140ms cubic-bezier(0.16, 1, 0.3, 1)",
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

  const hasShadow = buttonStyle === "raised" || (featured && buttonStyle !== "outline");
  const shadowDistance = featured ? 6 : 4;

  /*
    Hover lifts the button towards the reader and grows its shadow by the same
    amount it moved, so the offset stays put and only the gap opens up — the
    thing reads as rising off the page rather than sliding across it. Press
    then travels the whole way down and closes the shadow to nothing.

    Styles that have no shadow to open (flat, outline) get the lift alone;
    without it they'd be the only links on the page that don't react.
  */
  if (pressed) {
    variant.transform = hasShadow
      ? `translate(${shadowDistance}px, ${shadowDistance}px)`
      : "scale(0.985)";
    if (hasShadow) variant.boxShadow = "none";
  } else if (hovered) {
    variant.transform = "translate(-2px, -2px)";
    if (hasShadow) {
      variant.boxShadow = `${shadowDistance + 2}px ${shadowDistance + 2}px 0 0 var(--pt-ink)`;
    }
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={fireBeacon}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setPressed(false);
        setHovered(false);
      }}
      onPointerCancel={() => setPressed(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="animate-rise-in-stagger"
      style={{ ...base, ...variant, "--i": index } as CSSProperties}
    >
      {icon ? (
        <span aria-hidden className="mr-2 shrink-0">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 truncate">{title}</span>
    </a>
  );
}
