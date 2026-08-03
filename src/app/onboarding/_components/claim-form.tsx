"use client";

import { useActionState, useState } from "react";
import { Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { claimUsername, type ClaimState } from "../actions";

const initialState: ClaimState = {};

export function ClaimForm() {
  const [state, formAction, pending] = useActionState(
    claimUsername,
    initialState,
  );
  const [value, setValue] = useState("");

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="username">Choose your username</Label>
        <div className="flex items-stretch border-hard rounded-md overflow-hidden bg-surface-raised">
          <span className="flex items-center px-3 text-sm text-ink-muted border-r-2 border-border-strong select-none">
            link.xxoo.ooo/
          </span>
          <input
            id="username"
            name="username"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            autoComplete="off"
            placeholder="yourname"
            className="flex-1 bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </div>
      </div>

      <p className="text-sm text-ink-muted">
        Your page will live at{" "}
        <span className="font-stat text-ink">
          link.xxoo.ooo/{value.trim().toLowerCase() || "yourname"}
        </span>
      </p>

      {state.error && (
        <p className="text-sm font-semibold text-danger">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Claiming…" : "Claim it"}
      </Button>
    </form>
  );
}
