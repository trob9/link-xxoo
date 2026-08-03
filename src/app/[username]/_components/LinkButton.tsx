"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { ButtonStyle } from "@/lib/themes";

type Props = {
  id: string;
  title: string;
  url: string;
  featured: boolean;
  buttonStyle: ButtonStyle;
};

export default function LinkButton({
  id,
  title,
  url,
  featured,
  buttonStyle,
}: Props) {
  const [pressed, setPressed] = useState(false);

  function fireBeacon() {
    const endpoint = `/api/links/${id}/click`;
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(endpoint);
        return;
      }
    } catch {
      // fall through to fetch
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

  let variant: CSSProperties;
  if (buttonStyle === "hard") {
    variant = {
      background: "var(--pt-accent)",
      color: "var(--pt-accent-ink)",
      border: "2px solid var(--pt-ink)",
      borderRadius: 10,
      boxShadow: pressed ? "none" : "4px 4px 0 0 var(--pt-ink)",
      transform: pressed ? "translate(4px, 4px)" : "none",
    };
  } else if (buttonStyle === "soft") {
    variant = {
      background: "var(--pt-accent)",
      color: "var(--pt-accent-ink)",
      border: "none",
      borderRadius: 14,
    };
  } else {
    variant = {
      background: "transparent",
      color: "var(--pt-ink)",
      border: "2px solid var(--pt-accent)",
      borderRadius: 10,
    };
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={fireBeacon}
      onPointerDown={() => buttonStyle === "hard" && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{ ...base, ...variant }}
    >
      <span>{title}</span>
      {featured && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 22,
            height: 22,
            borderRadius: 9999,
            background: "var(--pt-accent)",
            color: "var(--pt-accent-ink)",
            border: "2px solid var(--pt-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            lineHeight: 1,
          }}
        >
          ★
        </span>
      )}
    </a>
  );
}
