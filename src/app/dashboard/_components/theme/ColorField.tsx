"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { normalizeHex } from "@/lib/contrast";

/**
 * One colour slot: a swatch that opens the OS colour picker, plus a hex field
 * for people who already know the value they want.
 *
 * The text field keeps its own draft state because a hex colour is invalid for
 * most of the time you're typing it — committing on every keystroke would make
 * the page flash through "#f", "#ff", "#ff5" as you go. It commits when the
 * text becomes a valid colour, and snaps back to the real value on blur if it
 * never does.
 */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Follow the committed value when it changes from outside (applying a theme,
  // taking a contrast fix) without clobbering what's being typed.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  function commit(text: string) {
    setDraft(text);
    const hex = normalizeHex(text);
    if (hex) onChange(hex);
  }

  const valid = normalizeHex(draft) !== null;

  return (
    <div className="flex items-center gap-3 rounded-md border-2 border-border-strong bg-surface p-2.5">
      <label
        className="relative h-11 w-11 shrink-0 cursor-pointer rounded border-2 border-border-strong"
        style={{ backgroundColor: value }}
      >
        <span className="sr-only">{label}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {label}
        </span>
        <input
          type="text"
          value={draft}
          spellCheck={false}
          autoComplete="off"
          aria-label={`${label} hex colour`}
          aria-invalid={!valid}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setDraft(value)}
          className={cn(
            "w-full bg-transparent font-stat text-sm text-ink outline-none",
            "focus:underline focus:decoration-action-primary focus:decoration-2 focus:underline-offset-4",
            !valid && "text-danger",
          )}
        />
      </div>
    </div>
  );
}
