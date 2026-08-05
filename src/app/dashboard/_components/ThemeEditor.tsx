"use client";

import { useActionState, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/input";
import { buttonStyleVariant } from "@/lib/button-style";
import {
  BACKGROUND_PATTERNS,
  BACKGROUND_PATTERN_LABELS,
  BUTTON_STYLES,
  getThemePreset,
  THEME_PRESETS,
  type BackgroundPattern,
  type ButtonStyle,
  type ThemePreset,
} from "@/lib/themes";
import { updateTheme, type ThemeState } from "../theme/actions";

const initialState: ThemeState = {};

export function ThemeEditor({
  currentPreset,
  accentOverride,
  buttonStyleOverride,
  backgroundPatternOverride,
}: {
  currentPreset: string;
  accentOverride: string | null;
  buttonStyleOverride: ButtonStyle | null;
  backgroundPatternOverride: BackgroundPattern | null;
}) {
  const [selected, setSelected] = useState(currentPreset);
  const [state, formAction, pending] = useActionState(updateTheme, initialState);

  const activeConfig = getThemePreset(selected).config;

  const [accentEnabled, setAccentEnabled] = useState(accentOverride !== null);
  const [accent, setAccent] = useState(accentOverride ?? activeConfig.accent);
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(
    buttonStyleOverride ?? activeConfig.buttonStyle,
  );
  const [pattern, setPattern] = useState<BackgroundPattern>(
    backgroundPatternOverride ?? activeConfig.backgroundPattern,
  );

  const effectiveAccent = accentEnabled ? accent : activeConfig.accent;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="presetKey" value={selected} />

      {/*
        Preview sits above the controls rather than beside them: the question
        being answered here is "what will my page look like", so the answer
        should be the first thing read, not something to go find in a tab.
      */}
      <ThemePreview
        config={activeConfig}
        accent={effectiveAccent}
        buttonStyle={buttonStyle}
        pattern={pattern}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THEME_PRESETS.map((preset) => (
          <PresetCard
            key={preset.key}
            preset={preset}
            active={selected === preset.key}
            onSelect={() => {
              setSelected(preset.key);
              // Controls the owner hasn't explicitly overridden should follow
              // the preset as it changes — otherwise the preview shows a blend
              // of the old preset's button style and the new one's colours.
              if (!buttonStyleOverride) {
                setButtonStyle(preset.config.buttonStyle);
              }
              if (!backgroundPatternOverride) {
                setPattern(preset.config.backgroundPattern);
              }
              if (!accentEnabled) setAccent(preset.config.accent);
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-5 rounded-md border-hard bg-surface-raised p-5 shadow-hard-sm">
        <h2 className="font-display text-xl">Customize</h2>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="accentEnabled"
              checked={accentEnabled}
              onChange={(e) => setAccentEnabled(e.target.checked)}
              className="h-4 w-4 border-hard accent-[var(--action-primary)]"
            />
            Override accent colour
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="accent"
              value={accent}
              disabled={!accentEnabled}
              onChange={(e) => setAccent(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded border-hard bg-surface-raised disabled:opacity-40"
            />
            <span className="font-stat text-sm text-ink-muted">
              {accentEnabled ? accent : `preset default (${activeConfig.accent})`}
            </span>
          </div>
        </div>

        <div>
          <Label>Button style</Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BUTTON_STYLES.map((style) => (
              <label
                key={style}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 p-4",
                  buttonStyle === style
                    ? "border-border-strong bg-surface shadow-hard-sm ring-2 ring-action-primary"
                    : "border-border-strong bg-surface hover:-translate-y-0.5",
                )}
              >
                <input
                  type="radio"
                  name="buttonStyle"
                  value={style}
                  checked={buttonStyle === style}
                  onChange={() => setButtonStyle(style)}
                  className="sr-only"
                />
                <ButtonStylePreview
                  style={style}
                  accent={effectiveAccent}
                  accentInk={activeConfig.accentInk}
                  ink={activeConfig.ink}
                />
                <span className="text-xs font-semibold uppercase tracking-wide text-ink">
                  {style}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Matching the preset default ({activeConfig.buttonStyle}) stores no
            override.
          </p>
        </div>

        <div>
          <Label>Background</Label>
          <div className="grid grid-cols-3 gap-3">
            {BACKGROUND_PATTERNS.map((option) => (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 p-3",
                  pattern === option
                    ? "border-border-strong bg-surface shadow-hard-sm ring-2 ring-action-primary"
                    : "border-border-strong bg-surface hover:-translate-y-0.5",
                )}
              >
                <input
                  type="radio"
                  name="backgroundPattern"
                  value={option}
                  checked={pattern === option}
                  onChange={() => setPattern(option)}
                  className="sr-only"
                />
                <span
                  data-pattern={option}
                  className="h-12 w-full rounded border-hard"
                  style={
                    {
                      background: activeConfig.background,
                      "--pt-ink": activeConfig.ink,
                    } as React.CSSProperties
                  }
                />
                <span className="text-xs font-semibold uppercase tracking-wide text-ink">
                  {BACKGROUND_PATTERN_LABELS[option]}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Drawn in CSS from your theme&rsquo;s own ink colour — there&rsquo;s
            no image to download, so it costs your visitors nothing.
          </p>
        </div>
      </div>

      {state.error ? (
        <p className="text-sm font-semibold text-danger">{state.error}</p>
      ) : null}
      {state.ok ? <Badge className="self-start">Saved</Badge> : null}

      <Button type="submit" variant="primary" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save theme"}
      </Button>
    </form>
  );
}

// A scaled-down stand-in for the real profile page — same background, pattern,
// avatar block and button treatment — so every control below has a visible
// consequence without leaving the page.
function ThemePreview({
  config,
  accent,
  buttonStyle,
  pattern,
}: {
  config: ThemePreset["config"];
  accent: string;
  buttonStyle: ButtonStyle;
  pattern: BackgroundPattern;
}) {
  const variant = buttonStyleVariant(buttonStyle, {
    accent,
    accentInk: config.accentInk,
    ink: config.ink,
  });

  return (
    <div>
      <Label>Preview</Label>
      <div
        data-pattern={pattern}
        className="flex flex-col items-center gap-2 rounded-md border-hard p-6 shadow-hard-sm"
        style={
          {
            background: config.background,
            color: config.ink,
            "--pt-ink": config.ink,
          } as React.CSSProperties
        }
      >
        <div
          aria-hidden
          className="h-14 w-14"
          style={{
            background: config.surface,
            border: `2px solid ${config.ink}`,
            borderRadius: 9999,
          }}
        />
        <p className="mt-1 text-base font-bold" style={{ color: config.ink }}>
          Your name
        </p>
        <p className="text-xs" style={{ color: config.inkMuted }}>
          A line about what you do.
        </p>
        <div className="mt-3 flex w-full max-w-[260px] flex-col gap-2.5">
          {["Latest release", "Shop", "Newsletter"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold"
              style={variant}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ButtonStylePreview({
  style,
  accent,
  accentInk,
  ink,
}: {
  style: ButtonStyle;
  accent: string;
  accentInk: string;
  ink: string;
}) {
  return (
    <div
      className="pointer-events-none flex w-full items-center justify-center px-3 py-2.5 text-xs font-semibold"
      style={buttonStyleVariant(style, { accent, accentInk, ink })}
    >
      Your link
    </div>
  );
}

function PresetCard({
  preset,
  active,
  onSelect,
}: {
  preset: ThemePreset;
  active: boolean;
  onSelect: () => void;
}) {
  const c = preset.config;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-3 rounded-md border-hard p-4 text-left transition-transform",
        active
          ? "shadow-hard ring-2 ring-action-primary"
          : "shadow-hard-sm hover:-translate-y-0.5",
      )}
      style={{ background: c.surface, color: c.ink }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-lg" style={{ color: c.ink }}>
          {preset.label}
        </span>
        {active ? <Badge>Active</Badge> : null}
      </div>
      <div className="flex h-8 overflow-hidden rounded border-2 border-border-strong">
        <span className="flex-1" style={{ background: c.background }} />
        <span className="flex-1" style={{ background: c.surface }} />
        <span className="flex-1" style={{ background: c.accent }} />
      </div>
      <p className="text-xs" style={{ color: c.inkMuted }}>
        {preset.description}
      </p>
    </button>
  );
}
