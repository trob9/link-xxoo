"use client";

import { cn } from "@/lib/cn";
import {
  contrastLevel,
  contrastRatio,
  formatRatio,
  suggestReadable,
  type ContrastLevel,
} from "@/lib/contrast";
import type { ThemeColorKey, ThemeConfig } from "@/lib/themes";

type Pair = {
  label: string;
  /** The colour we'd change to fix a failure — always the foreground. */
  fix: ThemeColorKey;
  fg: string;
  bg: string;
};

function pairsFor(config: ThemeConfig): Pair[] {
  return [
    { label: "Text on page", fix: "ink", fg: config.ink, bg: config.background },
    {
      label: "Secondary text",
      fix: "inkMuted",
      fg: config.inkMuted,
      bg: config.background,
    },
    { label: "Social icons", fix: "ink", fg: config.ink, bg: config.surface },
    {
      label: "Button label",
      fix: "accentInk",
      fg: config.accentInk,
      bg: config.accent,
    },
  ];
}

const LEVEL_STYLE: Record<ContrastLevel, string> = {
  aaa: "border-border-strong bg-accent-secondary text-accent-secondary-ink",
  aa: "border-border-strong bg-accent-secondary text-accent-secondary-ink",
  "aa-large": "border-border-strong bg-surface-raised text-ink",
  fail: "border-border-strong bg-danger text-danger-ink",
};

const LEVEL_TEXT: Record<ContrastLevel, string> = {
  aaa: "Great",
  aa: "Good",
  "aa-large": "Low",
  fail: "Unreadable",
};

export function ContrastReport({
  config,
  onFix,
}: {
  config: ThemeConfig;
  onFix: (key: ThemeColorKey, hex: string) => void;
}) {
  const rows = pairsFor(config).map((pair) => {
    const ratio = contrastRatio(pair.fg, pair.bg);
    return { ...pair, ratio, level: ratio === null ? null : contrastLevel(ratio) };
  });

  const problems = rows.filter(
    (row) => row.level === "fail" || row.level === "aa-large",
  ).length;

  return (
    <section className="rounded-md border-2 border-border-strong bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">Readability</h3>
        <p className="text-xs text-ink-muted">
          {problems === 0
            ? "All text easily readable"
            : `${problems} combination${problems === 1 ? "" : "s"} hard to read`}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          const suggestion =
            row.level === "fail" || row.level === "aa-large"
              ? suggestReadable(row.fg, row.bg)
              : null;

          return (
            <li
              key={row.label}
              className="flex flex-wrap items-center gap-x-3 gap-y-2"
            >
              <span
                aria-hidden
                className="grid h-8 w-8 shrink-0 place-items-center rounded border-2 border-border-strong text-sm font-bold"
                style={{ backgroundColor: row.bg, color: row.fg }}
              >
                Aa
              </span>
              <span className="flex-1 text-sm">{row.label}</span>
              <span className="font-stat text-xs text-ink-muted">
                {row.ratio === null ? "—" : formatRatio(row.ratio)}
              </span>
              <span
                className={cn(
                  "rounded border-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  row.level ? LEVEL_STYLE[row.level] : LEVEL_STYLE.fail,
                )}
              >
                {row.level ? LEVEL_TEXT[row.level] : "—"}
              </span>
              {suggestion ? (
                <button
                  type="button"
                  onClick={() => onFix(row.fix, suggestion)}
                  className="rounded border-2 border-border-strong bg-surface-raised px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink hover:bg-action-primary hover:text-action-primary-ink"
                >
                  Fix
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
