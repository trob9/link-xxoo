"use client";

import { cn } from "@/lib/cn";
import { buttonStyleVariant } from "@/lib/button-style";
import { DISPLAY_FONT_STACK, type ThemeConfig } from "@/lib/themes";

/**
 * The whole look in one tile: page colour, texture, and a real button drawn
 * with the theme's own button style. Applying a theme replaces every one of
 * those at once, so the tile has to show all of them — otherwise picking a
 * theme would change things the tile never mentioned.
 */
export function ThemeSwatch({ config }: { config: ThemeConfig }) {
  return (
    <span
      aria-hidden
      data-pattern={config.backgroundPattern}
      className="flex h-16 w-full items-center justify-center overflow-hidden rounded border-2 border-border-strong"
      style={
        {
          backgroundColor: config.background,
          fontFamily: DISPLAY_FONT_STACK[config.displayFont],
          "--pt-ink": config.ink,
        } as React.CSSProperties
      }
    >
      <span
        className="px-3 py-1 text-[11px] font-semibold"
        style={buttonStyleVariant(config.buttonStyle, {
          accent: config.accent,
          accentInk: config.accentInk,
          ink: config.ink,
        })}
      >
        Aa
      </span>
    </span>
  );
}

export function ThemeCard({
  config,
  name,
  caption,
  active,
  onApply,
  children,
}: {
  config: ThemeConfig;
  name: string;
  caption?: string;
  active: boolean;
  onApply: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-md border-2 border-border-strong bg-surface p-2.5",
        active ? "shadow-hard ring-2 ring-action-primary" : "shadow-hard-sm",
      )}
    >
      <button
        type="button"
        onClick={onApply}
        aria-pressed={active}
        // Without this the accessible name would be the swatch's decorative
        // "Aa" plus the name plus "In use" — announced as one run-on string.
        aria-label={`Use theme ${name}`}
        className="flex flex-col gap-2 text-left transition-transform duration-150 hover:-translate-y-0.5"
      >
        <ThemeSwatch config={config} />
        <span aria-hidden className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink">{name}</span>
          {active ? (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-action-primary">
              In use
            </span>
          ) : null}
        </span>
        {caption ? (
          <span className="block text-xs text-ink-muted">{caption}</span>
        ) : null}
      </button>
      {children}
    </div>
  );
}
