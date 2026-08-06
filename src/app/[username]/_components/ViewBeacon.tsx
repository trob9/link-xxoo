"use client";

import { useEffect, useRef } from "react";

/**
 * Records a view once per page load. Renders nothing.
 *
 * The ref guard matters in development, where React's Strict Mode runs
 * effects twice on purpose — without it every local page load would count as
 * two, and the click-through rate on the dashboard would read half its true
 * value.
 */
export default function ViewBeacon({ username }: { username: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const endpoint = `/api/profiles/${encodeURIComponent(username)}/view`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint);
      return;
    }
    fetch(endpoint, { method: "POST", keepalive: true }).catch(() => {});
  }, [username]);

  return null;
}
