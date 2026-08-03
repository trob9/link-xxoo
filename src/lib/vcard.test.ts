import { describe, expect, it } from "vitest";
import { buildVCard, escapeVCardText } from "@/lib/vcard";

describe("escapeVCardText", () => {
  it("leaves plain text untouched", () => {
    expect(escapeVCardText("Tom Builds")).toBe("Tom Builds");
  });

  it("escapes newlines instead of allowing raw line breaks", () => {
    expect(escapeVCardText("line one\nline two")).toBe("line one\\nline two");
  });

  it("escapes backslashes, commas, and semicolons", () => {
    expect(escapeVCardText("a\\b,c;d")).toBe("a\\\\b\\,c\\;d");
  });
});

describe("buildVCard", () => {
  it("does not let an injected newline create a new vCard property", () => {
    const malicious = "Hi!\nEMAIL:attacker@evil.com\nTEL:+10000000000";
    const vcard = buildVCard({
      displayName: "Real Person",
      bio: malicious,
      url: "https://link.xxoo.ooo/realperson",
    });

    const lines = vcard.split("\n");
    // The malicious payload must collapse into the single NOTE: line, not
    // spawn its own EMAIL:/TEL: property lines.
    expect(lines.some((l) => l.startsWith("EMAIL:attacker"))).toBe(false);
    expect(lines.some((l) => l.startsWith("TEL:"))).toBe(false);
    expect(vcard).toContain("NOTE:Hi!\\nEMAIL:attacker@evil.com\\nTEL:");
  });

  it("produces a well-formed vcard with the expected fields", () => {
    const vcard = buildVCard({
      displayName: "Tom",
      bio: "Building things",
      email: "tom@example.com",
      url: "https://link.xxoo.ooo/tom",
    });
    expect(vcard).toContain("BEGIN:VCARD");
    expect(vcard).toContain("FN:Tom");
    expect(vcard).toContain("NOTE:Building things");
    expect(vcard).toContain("EMAIL:tom@example.com");
    expect(vcard).toContain("URL:https://link.xxoo.ooo/tom");
    expect(vcard).toContain("END:VCARD");
  });
});
