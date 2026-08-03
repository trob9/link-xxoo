"use client";

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
    const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${displayName}`];
    if (bio) lines.push(`NOTE:${bio}`);
    if (email) lines.push(`EMAIL:${email}`);
    lines.push(`URL:${window.location.origin}/${username}`);
    lines.push("END:VCARD");

    const blob = new Blob([lines.join("\n")], { type: "text/vcard" });
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
