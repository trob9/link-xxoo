"use client";

import { buildVCard } from "@/lib/vcard";

type Props = {
  username: string;
  displayName: string;
  bio?: string | null;
  email?: string | null;
};

export default function SaveContact({
  username,
  displayName,
  bio,
  email,
}: Props) {
  function save() {
    const vcard = buildVCard({
      displayName,
      bio,
      email,
      url: `${window.location.origin}/${username}`,
    });

    const blob = new Blob([vcard], { type: "text/vcard" });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${username}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <button
      type="button"
      onClick={save}
      style={{
        marginTop: 4,
        minHeight: 44,
        padding: "8px 20px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        background: "transparent",
        color: "var(--pt-ink)",
        border: "2px solid var(--pt-ink)",
        borderRadius: 10,
      }}
    >
      Save contact
    </button>
  );
}
