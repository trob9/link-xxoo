"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  updateProfileSettings,
  type SettingsState,
} from "../settings/actions";

const initialState: SettingsState = {};

export function SettingsForm({
  displayName,
  bio,
  seoTitle,
  seoDescription,
  sensitiveContent,
}: {
  displayName: string;
  bio: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sensitiveContent: boolean;
}) {
  const [sensitive, setSensitive] = useState(sensitiveContent);
  const [state, formAction, pending] = useActionState(
    updateProfileSettings,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {sensitive ? (
        <input type="hidden" name="sensitiveContent" value="on" />
      ) : null}

      <div>
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" defaultValue={displayName} required maxLength={60} />
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={bio ?? ""} rows={3} maxLength={280} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="seoTitle">SEO title</Label>
          <Input id="seoTitle" name="seoTitle" defaultValue={seoTitle ?? ""} maxLength={70} />
        </div>
        <div>
          <Label htmlFor="seoDescription">SEO description</Label>
          <Input id="seoDescription" name="seoDescription" defaultValue={seoDescription ?? ""} maxLength={160} />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border-hard bg-surface-raised p-3">
        <div>
          <p className="text-sm font-semibold">Sensitive content</p>
          <p className="text-xs text-ink-muted">
            Show an 18+ interstitial before your page.
          </p>
        </div>
        <Switch
          checked={sensitive}
          label="Sensitive content"
          onChange={setSensitive}
        />
      </div>

      {state.error ? (
        <p className="text-sm font-semibold text-danger">{state.error}</p>
      ) : null}
      {state.ok ? <Badge className="self-start">Saved</Badge> : null}

      <Button type="submit" variant="primary" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
