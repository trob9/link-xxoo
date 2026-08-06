"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { buttonStyleVariant } from "@/lib/button-style";
import {
  AVATAR_SHAPES,
  AVATAR_SHAPE_RADIUS,
  type AvatarShape,
} from "@/lib/avatar-shape";
import {
  BACKGROUND_PATTERNS,
  BACKGROUND_PATTERN_LABELS,
  BUTTON_STYLES,
  BUTTON_STYLE_LABELS,
  DISPLAY_FONTS,
  DISPLAY_FONT_LABELS,
  DISPLAY_FONT_STACK,
  THEME_COLOR_KEYS,
  THEME_COLOR_LABELS,
  THEME_PRESETS,
  themeConfigsEqual,
  type BackgroundPattern,
  type ButtonStyle,
  type DisplayFont,
  type ThemeColorKey,
  type ThemeConfig,
} from "@/lib/themes";
import {
  deleteCustomTheme,
  renameCustomTheme,
  saveTheme,
  saveThemeAs,
  type ThemeState,
} from "../../theme/actions";
import { ColorField } from "./ColorField";
import { ContrastReport } from "./ContrastReport";
import { OptionCards } from "./OptionCards";
import { ProfilePreview } from "./ProfilePreview";
import { ThemeCard } from "./ThemeCard";

export type SavedTheme = ThemeConfig & { id: string; name: string };

const AVATAR_SHAPE_LABELS: Record<AvatarShape, string> = {
  circle: "Circle",
  rounded: "Rounded",
  square: "Square",
};

const initialState: ThemeState = {};

function toFormData(
  config: ThemeConfig,
  extra: Record<string, string | null | undefined>,
): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(config)) fd.set(key, String(value));
  for (const [key, value] of Object.entries(extra)) {
    if (value) fd.set(key, value);
  }
  return fd;
}

export function ThemeEditor({
  initialConfig,
  initialAvatarShape,
  initialPresetKey,
  initialActiveThemeId,
  savedThemes,
  displayName,
  bio,
  avatarSrc,
  avatarEnabled,
  previewLinks,
}: {
  initialConfig: ThemeConfig;
  initialAvatarShape: AvatarShape;
  initialPresetKey: string;
  initialActiveThemeId: string | null;
  savedThemes: SavedTheme[];
  displayName: string;
  bio: string | null;
  avatarSrc: string | null;
  avatarEnabled: boolean;
  previewLinks: { title: string; featured: boolean }[];
}) {
  const [config, setConfig] = useState(initialConfig);
  const [avatarShape, setAvatarShape] = useState(initialAvatarShape);
  const [presetKey, setPresetKey] = useState(initialPresetKey);
  const [activeThemeId, setActiveThemeId] = useState(initialActiveThemeId);
  const [naming, setNaming] = useState(false);
  const [newName, setNewName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // What's on the server. "Unsaved changes" is the difference between this and
  // the draft above.
  const [baseConfig, setBaseConfig] = useState(initialConfig);
  const [baseShape, setBaseShape] = useState(initialAvatarShape);

  const [saveState, save, saving] = useActionState(saveTheme, initialState);
  const [saveAsState, saveAs, savingAs] = useActionState(
    saveThemeAs,
    initialState,
  );

  // Props change when the server re-renders this page — a fresh load, or
  // revalidation after any mutation. Following them keeps the editor honest
  // about what's stored.
  const propsKey = JSON.stringify([
    initialConfig,
    initialAvatarShape,
    initialPresetKey,
    initialActiveThemeId,
  ]);
  const [lastPropsKey, setLastPropsKey] = useState(propsKey);
  if (propsKey !== lastPropsKey) {
    setLastPropsKey(propsKey);
    setConfig(initialConfig);
    setBaseConfig(initialConfig);
    setAvatarShape(initialAvatarShape);
    setBaseShape(initialAvatarShape);
    setPresetKey(initialPresetKey);
    setActiveThemeId(initialActiveThemeId);
    setNaming(false);
    setNewName("");
  }

  // A save reports back exactly what it wrote. Re-baselining from that is
  // immediate and always correct — waiting for revalidated props is a race,
  // and it never fires at all when the save wrote values the row already had.
  const saved = saveState.saved ?? saveAsState.saved;
  const [lastSaved, setLastSaved] = useState(saved);
  if (saved && saved !== lastSaved) {
    setLastSaved(saved);
    setConfig(saved.config);
    setBaseConfig(saved.config);
    if (saved.avatarShape) {
      setAvatarShape(saved.avatarShape);
      setBaseShape(saved.avatarShape);
    }
    setActiveThemeId(saved.activeThemeId);
    setNaming(false);
    setNewName("");
  }

  const dirty =
    !themeConfigsEqual(config, baseConfig) || avatarShape !== baseShape;

  const activeTheme = savedThemes.find((theme) => theme.id === activeThemeId);
  const busy = saving || savingAs;
  const error = saveState.error ?? saveAsState.error;

  function set<K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function applyTheme(next: ThemeConfig, source: {
    presetKey?: string;
    themeId?: string | null;
  }) {
    setConfig(next);
    if (source.presetKey) setPresetKey(source.presetKey);
    setActiveThemeId(source.themeId ?? null);
  }

  function submitSave() {
    if (busy) return;
    startTransition(() =>
      save(toFormData(config, { avatarShape, presetKey, activeThemeId })),
    );
  }

  function submitSaveAs(name: string) {
    startTransition(() =>
      saveAs(toFormData(config, { avatarShape, presetKey, name })),
    );
  }

  function discard() {
    setConfig(baseConfig);
    setAvatarShape(baseShape);
    setPresetKey(initialPresetKey);
    setActiveThemeId(initialActiveThemeId);
  }

  // Cmd/Ctrl+S saves, the way every other editor does. Without this the only
  // way to commit a change is to scroll to the bar, which on a long page of
  // colour controls is a real cost.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty) submitSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (naming) nameInputRef.current?.focus();
  }, [naming]);

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-8">
      {/*
        Preview first in the DOM on mobile (it answers "what will this look
        like"), but pinned beside the controls on a wide screen so it stays
        visible while you work down the colour list.
      */}
      <div className="order-first lg:order-last lg:sticky lg:top-6">
        <Label>Preview</Label>
        <ProfilePreview
          config={config}
          avatarShape={avatarShape}
          avatarSrc={avatarSrc}
          avatarEnabled={avatarEnabled}
          displayName={displayName}
          bio={bio}
          links={previewLinks}
        />
      </div>

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl">Your themes</h2>
            {savedThemes.length > 0 ? (
              <span className="font-stat text-xs text-ink-muted">
                {savedThemes.length} saved
              </span>
            ) : null}
          </div>

          {savedThemes.length === 0 ? (
            <p className="rounded-md border-2 border-dashed border-border-strong bg-surface p-4 text-sm text-ink-muted">
              Change any colour below, then save it as a theme to reuse later.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {savedThemes.map((theme) => (
                <SavedThemeCard
                  key={theme.id}
                  theme={theme}
                  active={activeThemeId === theme.id}
                  onApply={() => applyTheme(theme, { themeId: theme.id })}
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Start from a preset</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {THEME_PRESETS.map((preset) => (
              <ThemeCard
                key={preset.key}
                config={preset.config}
                name={preset.label}
                active={!activeThemeId && presetKey === preset.key}
                onApply={() =>
                  applyTheme(preset.config, {
                    presetKey: preset.key,
                    themeId: null,
                  })
                }
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-md border-2 border-border-strong bg-surface-raised p-5 shadow-hard-sm">
          <h2 className="font-display text-xl">Colours</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {THEME_COLOR_KEYS.map((key) => (
              <ColorField
                key={key}
                label={THEME_COLOR_LABELS[key]}
                value={config[key]}
                onChange={(hex) => set(key, hex)}
              />
            ))}
          </div>
          <ContrastReport
            config={config}
            onFix={(key: ThemeColorKey, hex) => set(key, hex)}
          />
        </section>

        <section className="flex flex-col gap-5 rounded-md border-2 border-border-strong bg-surface-raised p-5 shadow-hard-sm">
          <h2 className="font-display text-xl">Style</h2>

          <div>
            <Label>Buttons</Label>
            <OptionCards
              name="buttonStyle"
              value={config.buttonStyle}
              onChange={(value: ButtonStyle) => set("buttonStyle", value)}
              options={BUTTON_STYLES.map((style) => ({
                value: style,
                label: BUTTON_STYLE_LABELS[style],
                // Drawn on the theme's own background, not the dashboard's:
                // "outline" is a transparent button coloured with the theme's
                // ink, so on any other backdrop it reads as either invisible
                // or the wrong colour entirely.
                render: () => (
                  <span
                    className="flex w-full items-center justify-center rounded border-2 border-border-strong px-2 py-3"
                    style={{ backgroundColor: config.background }}
                  >
                    <span
                      className="flex w-full items-center justify-center px-2 py-1.5 text-[11px] font-semibold"
                      style={buttonStyleVariant(style, {
                        accent: config.accent,
                        accentInk: config.accentInk,
                        ink: config.ink,
                      })}
                    >
                      Link
                    </span>
                  </span>
                ),
              }))}
            />
          </div>

          <div>
            <Label>Background</Label>
            <OptionCards
              name="backgroundPattern"
              value={config.backgroundPattern}
              onChange={(value: BackgroundPattern) =>
                set("backgroundPattern", value)
              }
              options={BACKGROUND_PATTERNS.map((pattern) => ({
                value: pattern,
                label: BACKGROUND_PATTERN_LABELS[pattern],
                render: () => (
                  <span
                    data-pattern={pattern}
                    className="block h-10 w-full rounded border-2 border-border-strong"
                    style={
                      {
                        backgroundColor: config.background,
                        "--pt-ink": config.ink,
                      } as React.CSSProperties
                    }
                  />
                ),
              }))}
            />
          </div>

          <div>
            <Label>Font</Label>
            <OptionCards
              name="displayFont"
              value={config.displayFont}
              onChange={(value: DisplayFont) => set("displayFont", value)}
              options={DISPLAY_FONTS.map((font) => ({
                value: font,
                label: DISPLAY_FONT_LABELS[font],
                render: () => (
                  <span
                    className="grid h-10 w-full place-items-center rounded border-2 border-border-strong bg-surface text-lg font-bold text-ink"
                    style={{ fontFamily: DISPLAY_FONT_STACK[font] }}
                  >
                    Ag
                  </span>
                ),
              }))}
            />
          </div>

          <div>
            <Label>Profile picture</Label>
            <OptionCards
              name="avatarShape"
              value={avatarShape}
              onChange={setAvatarShape}
              options={AVATAR_SHAPES.map((shape) => ({
                value: shape,
                label: AVATAR_SHAPE_LABELS[shape],
                render: () => (
                  <span
                    className="grid h-10 w-10 place-items-center overflow-hidden border-2 border-border-strong bg-surface text-sm font-bold text-ink"
                    style={{ borderRadius: AVATAR_SHAPE_RADIUS[shape] }}
                  >
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      displayName.trim().charAt(0).toUpperCase() || "?"
                    )}
                  </span>
                ),
              }))}
            />
          </div>
        </section>
      </div>

      <SaveBar
        visible={dirty || naming}
        busy={busy}
        error={error}
        activeThemeName={activeTheme?.name ?? null}
        naming={naming}
        newName={newName}
        nameInputRef={nameInputRef}
        onNameChange={setNewName}
        onStartNaming={() => {
          setNewName(activeTheme?.name ? `${activeTheme.name} copy` : "My theme");
          setNaming(true);
        }}
        onCancelNaming={() => setNaming(false)}
        onSaveAs={() => submitSaveAs(newName)}
        onSave={submitSave}
        onDiscard={discard}
      />
    </div>
  );
}

function SaveBar({
  visible,
  busy,
  error,
  activeThemeName,
  naming,
  newName,
  nameInputRef,
  onNameChange,
  onStartNaming,
  onCancelNaming,
  onSaveAs,
  onSave,
  onDiscard,
}: {
  visible: boolean;
  busy: boolean;
  error?: string;
  activeThemeName: string | null;
  naming: boolean;
  newName: string;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  onNameChange: (value: string) => void;
  onStartNaming: () => void;
  onCancelNaming: () => void;
  onSaveAs: () => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      // Always mounted so it can slide rather than pop, and aria-hidden while
      // it's off-screen so a screen reader doesn't announce buttons that
      // aren't reachable.
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t-2 border-border-strong bg-surface-raised px-4 py-3",
        "transition-transform duration-200 ease-out",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
        {naming ? (
          <>
            <input
              ref={nameInputRef}
              value={newName}
              maxLength={40}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveAs();
                if (e.key === "Escape") onCancelNaming();
              }}
              aria-label="Theme name"
              placeholder="Theme name"
              className="min-w-0 flex-1 rounded-md border-2 border-border-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-action-primary"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelNaming}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSaveAs}
              disabled={busy || newName.trim().length === 0}
            >
              {busy ? "Saving…" : "Save theme"}
            </Button>
          </>
        ) : (
          <>
            {/*
              The target of "Save" belongs in the status line, not on the
              button: "Save to Long Theme Name" wraps the bar onto two rows on
              a phone, and the button still has to read as the primary action
              at a glance.
            */}
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">
              {error ? (
                <span className="text-danger">{error}</span>
              ) : activeThemeName ? (
                <>
                  Unsaved changes to{" "}
                  <span className="font-stat">{activeThemeName}</span>
                </>
              ) : (
                "Unsaved changes"
              )}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              disabled={busy}
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onStartNaming}
              disabled={busy}
            >
              Save as new
            </Button>
            <Button type="button" size="sm" onClick={onSave} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function SavedThemeCard({
  theme,
  active,
  onApply,
}: {
  theme: SavedTheme;
  active: boolean;
  onApply: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState(theme.name);
  const [renameState, rename, renaming_] = useActionState(
    renameCustomTheme,
    initialState,
  );

  function submitRename() {
    const fd = new FormData();
    fd.set("themeId", theme.id);
    fd.set("name", name);
    startTransition(() => rename(fd));
    setRenaming(false);
  }

  return (
    <ThemeCard
      config={theme}
      name={theme.name}
      active={active}
      onApply={onApply}
    >
      {renaming ? (
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") {
                setName(theme.name);
                setRenaming(false);
              }
            }}
            aria-label="Theme name"
            className="min-w-0 flex-1 rounded border-2 border-border-strong bg-surface px-2 py-1 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-action-primary"
          />
          <Button
            type="button"
            size="sm"
            onClick={submitRename}
            disabled={renaming_ || name.trim().length === 0}
          >
            OK
          </Button>
        </div>
      ) : confirmingDelete ? (
        <div className="flex items-center gap-1.5">
          <span className="flex-1 text-xs font-semibold">Delete?</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmingDelete(false)}
          >
            No
          </Button>
          <form
            action={deleteCustomTheme}
            onSubmit={() => setConfirmingDelete(false)}
          >
            <input type="hidden" name="themeId" value={theme.id} />
            <Button type="submit" variant="danger" size="sm">
              Yes
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="flex-1 rounded border-2 border-border-strong bg-surface-raised px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink hover:bg-action-primary hover:text-action-primary-ink"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex-1 rounded border-2 border-border-strong bg-surface-raised px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink hover:bg-danger hover:text-danger-ink"
          >
            Delete
          </button>
        </div>
      )}
      {renameState.error ? (
        <p className="text-xs font-semibold text-danger">{renameState.error}</p>
      ) : null}
    </ThemeCard>
  );
}
