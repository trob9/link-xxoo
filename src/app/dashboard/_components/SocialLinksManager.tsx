"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FocusEvent } from "react";
import { Button } from "@/components/ui/button";
import { fieldClasses, Input, Label } from "@/components/ui/input";
import { PLATFORM_HOSTS, SOCIAL_PLATFORMS, normalizeSocialUrl } from "@/lib/validation";
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
  const [platform, setPlatform] = useState<(typeof SOCIAL_PLATFORMS)[number]>(
    SOCIAL_PLATFORMS[0],
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  function onUrlBlur(e: FocusEvent<HTMLInputElement>) {
    const next = normalizeSocialUrl(platform, e.target.value);
    if (next !== e.target.value) e.target.value = next;
  }

  const allowedHosts = PLATFORM_HOSTS[platform];
  const hint =
    platform === "email"
      ? "Your email address."
      : allowedHosts
        ? `Must be a link to ${allowedHosts[0]}.`
        : "Any http(s) link.";

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
            value={platform}
            onChange={(e) =>
              setPlatform(e.target.value as (typeof SOCIAL_PLATFORMS)[number])
            }
            className={fieldClasses}
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <Label htmlFor="social-url">
            {platform === "email" ? "Email address" : "URL"}
          </Label>
          <Input
            id="social-url"
            name="url"
            type="text"
            required
            placeholder={platform === "email" ? "you@example.com" : "instagram.com/you"}
            onBlur={onUrlBlur}
          />
          <p className="mt-1 text-xs text-ink-muted">{hint}</p>
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
