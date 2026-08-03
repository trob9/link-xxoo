// RFC 6350 TEXT-value escaping. Without this, a bio/displayName containing
// a literal newline could inject extra vCard property lines (e.g. a fake
// EMAIL:/TEL:) into whatever the visitor's device downloads and imports.
export function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildVCard(params: {
  displayName: string;
  bio?: string | null;
  email?: string | null;
  url: string;
}): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCardText(params.displayName)}`,
  ];
  if (params.bio) lines.push(`NOTE:${escapeVCardText(params.bio)}`);
  if (params.email) lines.push(`EMAIL:${escapeVCardText(params.email)}`);
  lines.push(`URL:${escapeVCardText(params.url)}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}
