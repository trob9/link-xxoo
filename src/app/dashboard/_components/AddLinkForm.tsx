"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { normalizeUrlOnBlur } from "@/lib/normalize-url-on-blur";
import { createLink, type FormState } from "../actions";

const initialState: FormState = {};

export function AddLinkForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createLink, initialState);
  const [prevState, setPrevState] = useState(state);
  const formRef = useRef<HTMLFormElement>(null);

  // Adjust state during render (not in an effect) when the action state
  // object changes identity, per React's "adjusting state" pattern.
  if (state !== prevState) {
    setPrevState(state);
    if (state.ok) setOpen(false);
  }

  // The form-reset itself is an imperative DOM action, which does belong in
  // an effect — it just shouldn't be bundled with the setState call above.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="primary">
        + Add link
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-md border-hard bg-surface-raised p-4 shadow-hard-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="add-title">Title</Label>
          <Input id="add-title" name="title" required maxLength={80} placeholder="My newest track" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="add-url">URL</Label>
          <Input
            id="add-url"
            name="url"
            type="text"
            required
            placeholder="yoursite.com"
            onBlur={normalizeUrlOnBlur}
          />
        </div>
        <div>
          <Label htmlFor="add-icon">Icon / emoji (optional)</Label>
          <EmojiPicker id="add-icon" name="icon" />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="featured"
              className="h-4 w-4 border-hard accent-[var(--action-primary)]"
            />
            Feature this link
          </label>
        </div>
        <div>
          <Label htmlFor="add-start">Starts (optional)</Label>
          <Input id="add-start" name="startsAt" type="datetime-local" />
        </div>
        <div>
          <Label htmlFor="add-end">Ends (optional)</Label>
          <Input id="add-end" name="endsAt" type="datetime-local" />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm font-semibold text-danger">{state.error}</p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save link"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
