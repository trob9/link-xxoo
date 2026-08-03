"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export default function SensitiveGate({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) return <>{children}</>;

  return (
    <div
      className="mt-8 flex flex-col items-center gap-4 text-center"
      style={{
        background: "var(--pt-surface)",
        color: "var(--pt-ink)",
        border: "2px solid var(--pt-ink)",
        boxShadow: "4px 4px 0 0 var(--pt-ink)",
        borderRadius: 12,
        padding: "28px 24px",
      }}
    >
      <p style={{ fontWeight: 600, fontSize: 17 }}>
        This profile may contain sensitive content
      </p>
      <p style={{ color: "var(--pt-ink-muted)", fontSize: 14 }}>
        Continue only if you&rsquo;re comfortable viewing it.
      </p>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        style={{
          minHeight: 48,
          padding: "10px 28px",
          fontWeight: 600,
          cursor: "pointer",
          background: "var(--pt-accent)",
          color: "var(--pt-accent-ink)",
          border: "2px solid var(--pt-ink)",
          borderRadius: 10,
          boxShadow: "3px 3px 0 0 var(--pt-ink)",
        }}
      >
        Continue
      </button>
    </div>
  );
}
