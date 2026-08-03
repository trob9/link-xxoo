// A callbackUrl query param is attacker-controlled. Only ever redirect to a
// same-app relative path — passing it straight to redirect()/signIn without
// this check is an open redirect (e.g. ?callbackUrl=https://evil.example or
// the protocol-relative //evil.example).
export function safeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (candidate && candidate.startsWith("/") && !candidate.startsWith("//")) {
    return candidate;
  }
  return fallback;
}
