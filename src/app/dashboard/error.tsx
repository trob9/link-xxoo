"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Panel className="flex flex-col items-start gap-4 p-8">
      <h1 className="font-display text-2xl">That didn&rsquo;t load</h1>
      <p className="text-sm text-ink-muted">
        Something broke on our side. Your links are safe.
      </p>
      <Button onClick={reset}>Try again</Button>
      {/*
        The digest is the only handle on a specific server-side failure —
        production error messages are deliberately scrubbed, so without it a
        report is untraceable.
      */}
      {error.digest ? (
        <p className="font-stat text-xs text-ink-muted">
          Reference: {error.digest}
        </p>
      ) : null}
    </Panel>
  );
}
