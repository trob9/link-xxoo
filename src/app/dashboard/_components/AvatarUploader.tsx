"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AVATAR_SHAPE_RADIUS,
  AVATAR_SHAPES,
  type AvatarShape,
} from "@/lib/avatar-shape";
import {
  removeAvatarImage,
  updateAvatar,
  type SettingsState,
} from "../settings/actions";

const initialState: SettingsState = {};

const SHAPE_LABEL: Record<AvatarShape, string> = {
  circle: "Circle",
  rounded: "Rounded",
  square: "Square",
};

export function AvatarUploader({
  displayName,
  currentSrc,
  hasCustomImage,
  initialShape,
  initialEnabled,
}: {
  displayName: string;
  currentSrc: string | null;
  hasCustomImage: boolean;
  initialShape: AvatarShape;
  initialEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateAvatar,
    initialState,
  );
  const [shape, setShape] = useState<AvatarShape>(initialShape);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [removing, startRemoveTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    if (!file) {
      objectUrlRef.current = null;
      setPreviewSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewSrc(url);
  }

  function clearPendingFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setPreviewSrc(null);
  }

  // On a successful save, the parent Server Component re-fetches and passes
  // a fresh currentSrc reflecting the upload — drop the transient
  // object-URL preview so we switch over to showing that, instead of
  // claiming "new photo selected" forever. State adjustment happens during
  // render (not in the effect below) per React's "adjusting state" pattern;
  // the effect only does the imperative object-URL/file-input cleanup.
  const [prevOk, setPrevOk] = useState(state.ok);
  if (state.ok !== prevOk) {
    setPrevOk(state.ok);
    if (state.ok) setPreviewSrc(null);
  }

  useEffect(() => {
    if (!state.ok) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, [state.ok]);

  const effectiveSrc = previewSrc ?? currentSrc;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Profile picture shape
        </p>
        <div className="grid grid-cols-3 gap-3">
          {AVATAR_SHAPES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setShape(option)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-md border-2 p-3",
                shape === option
                  ? "border-border-strong bg-surface-raised shadow-hard-sm ring-2 ring-action-primary"
                  : "border-border-strong bg-surface-raised hover:-translate-y-0.5",
              )}
            >
              <div
                className="grid h-16 w-16 place-items-center overflow-hidden border-2 border-border-strong bg-surface text-lg font-bold"
                style={{ borderRadius: AVATAR_SHAPE_RADIUS[option] }}
              >
                {effectiveSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={effectiveSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span aria-hidden>{initial}</span>
                )}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide">
                {SHAPE_LABEL[option]}
              </span>
            </button>
          ))}
        </div>
        <input type="hidden" name="avatarShape" value={shape} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose photo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        {previewSrc ? (
          <button
            type="button"
            onClick={clearPendingFile}
            className="text-xs font-semibold uppercase tracking-wide text-ink-muted underline"
          >
            Cancel selection
          </button>
        ) : hasCustomImage ? (
          // A nested <form> inside the outer one isn't valid HTML, so this
          // calls the server action directly instead of using action=.
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={removing}
            onClick={() => startRemoveTransition(() => removeAvatarImage())}
          >
            {removing ? "Removing…" : "Remove photo"}
          </Button>
        ) : null}
        {previewSrc ? <Badge>New photo selected</Badge> : null}
      </div>

      <p className="text-xs text-ink-muted">
        JPG, PNG, GIF, or WebP, up to 8MB — auto-converted to WebP and
        cropped to a square.
      </p>

      <div className="flex items-center justify-between rounded-md border-hard bg-surface-raised p-3">
        <div>
          <p className="text-sm font-semibold">Show profile picture</p>
          <p className="text-xs text-ink-muted">
            Turn off to hide it entirely on your public page.
          </p>
        </div>
        <Switch
          checked={enabled}
          label="Show profile picture"
          onChange={setEnabled}
        />
        <input
          type="hidden"
          name="avatarEnabled"
          value={enabled ? "on" : "off"}
        />
      </div>

      {state.error ? (
        <p className="text-sm font-semibold text-danger">{state.error}</p>
      ) : null}
      {state.ok && !previewSrc ? (
        <Badge className="self-start">Saved</Badge>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
