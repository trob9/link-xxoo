"use client";

import { cn } from "@/lib/cn";

export type Option<T extends string> = {
  value: T;
  label: string;
  render: () => React.ReactNode;
};

/**
 * A radio group drawn as cards. Real `<input type="radio">` elements sit
 * behind the cards rather than being replaced by click handlers, so the
 * browser's own roving-focus behaviour — arrow keys move between options,
 * Tab skips past the whole group — works without being reimplemented.
 */
export function OptionCards<T extends string>({
  name,
  value,
  options,
  onChange,
  columns = 3,
}: {
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  columns?: 3 | 4;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "grid gap-2.5",
        columns === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "group flex cursor-pointer flex-col items-center gap-2.5 rounded-md border-2 border-border-strong bg-surface p-3",
              "transition-[transform,box-shadow] duration-150",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-action-primary",
              selected
                ? "shadow-hard-sm ring-2 ring-action-primary"
                : "hover:-translate-y-0.5 hover:shadow-hard-sm",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.render()}
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink">
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
