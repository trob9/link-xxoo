"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { fieldClasses, Input, Label } from "@/components/ui/input";
import { SOCIAL_PLATFORMS } from "@/lib/validation";
import {
  addSocialLink,
  deleteSocialLink,
  type SettingsState,
} from "../settings/actions";

export type DashboardSocial = {
  id: string;
  platform: string;
  url: string;
};

const initialState: SettingsState = {};

export function SocialLinksManager({ socials }: { socials: DashboardSocial[] }) {
  const [state, formAction, pending] = useActionState(
    addSocialLink,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <div className="flex flex-col gap-4">
      {socials.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {socials.map((social) => (
            <li
              key={social.id}
              className="flex items-center gap-3 rounded-md border-hard bg-surface-raised p-3"
            >
              <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide">
                {social.platform}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">
                {social.url}
              </span>
              <form action={deleteSocialLink.bind(null, social.id)}>
                <Button type="submit" variant="danger" size="sm">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No social links yet.</p>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-3 border-t-2 border-border-strong pt-4 sm:flex-row sm:items-end"
      >
        <div className="sm:w-40">
          <Label htmlFor="platform">Platform</Label>
          <select
            id="platform"
            name="platform"
            className={fieldClasses}
          >
            {SOCIAL_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <Label htmlFor="social-url">URL or handle</Label>
          <Input id="social-url" name="url" required placeholder="https://…" />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </form>

      {state.error ? (
        <p className="text-sm font-semibold text-danger">{state.error}</p>
      ) : null}
    </div>
  );
}
