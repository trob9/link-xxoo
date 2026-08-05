// Turns whatever a user typed/pasted into a proper https:// URL, without
// ever double-prefixing something that already has a scheme.
//
//   "example.com"          -> "https://example.com"
//   "http://example.com"   -> "https://example.com"   (upgraded, not stacked)
//   "https://example.com"  -> "https://example.com"   (untouched)
//   "//example.com"        -> "https://example.com"
export function normalizeUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === "") return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  if (trimmed.startsWith("//")) {
    return "https:" + trimmed;
  }

  return "https://" + trimmed;
}
