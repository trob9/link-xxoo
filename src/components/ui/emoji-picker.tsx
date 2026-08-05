"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { EMOJI_PICKER_OPTIONS, isSingleEmoji } from "@/lib/emoji";

export function EmojiPicker({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function commit(next: string) {
    const trimmed = next.trim();
    setValue(trimmed);
    setInvalid(trimmed !== "" && !isSingleEmoji(trimmed));
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2">
        <input
          id={id}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          placeholder="🙂"
          maxLength={16}
          className={cn(
            "h-10 w-16 rounded-md border-hard bg-surface-raised px-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-action-primary",
            invalid && "border-danger",
          )}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border-hard bg-surface-raised px-3 py-2 text-xs font-semibold uppercase tracking-wide"
        >
          Pick
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => commit("")}
            className="text-xs font-semibold uppercase tracking-wide text-ink-muted underline"
          >
            Clear
          </button>
        ) : null}
      </div>

      {invalid ? (
        <p className="mt-1 text-xs font-semibold text-danger">
          Emoji only — no text.
        </p>
      ) : null}

      {open ? (
        <div className="absolute z-10 mt-2 grid max-h-56 w-64 grid-cols-8 gap-1 overflow-y-auto rounded-md border-hard bg-surface-raised p-3 shadow-hard">
          {EMOJI_PICKER_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                commit(emoji);
                setOpen(false);
              }}
              className={cn(
                "grid h-7 w-7 place-items-center rounded text-base hover:bg-surface",
                value === emoji && "bg-accent-secondary",
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
