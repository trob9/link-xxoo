import sharp from "sharp";

// Server-only (imports sharp, a native Node module) — never import this
// from a client component. Shape constants live in ./avatar-shape instead,
// which is safe for both client and server.
export const AVATAR_MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB, before processing
export const AVATAR_SIZE = 512; // stored square size in px

// Raster formats only — deliberately excludes SVG. sharp/libvips can
// rasterize SVG via librsvg, which parses XML and can pull in external
// references (fonts, images) during rendering: an XXE/SSRF-shaped risk we
// have no reason to accept for a "photo" upload. No mainstream avatar
// upload (Discord, GitHub, etc.) accepts SVG for exactly this reason.
//
// The magic-byte check below is the actual security gate, not this list —
// the browser-reported File.type is just the client-declared Content-Type
// of that form-data part, fully attacker-controlled on a direct API call.
// sharp detects format from real file content regardless of what a caller
// claims, so a spoofed-MIME SVG upload would still reach librsvg if we
// only checked File.type.
const MAGIC_BYTES: { format: string; sniff: (buf: Buffer) => boolean }[] = [
  { format: "jpeg", sniff: (buf) => buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) },
  {
    format: "png",
    sniff: (buf) =>
      buf
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    format: "gif",
    sniff: (buf) =>
      buf.subarray(0, 6).toString("ascii") === "GIF87a" ||
      buf.subarray(0, 6).toString("ascii") === "GIF89a",
  },
  {
    format: "webp",
    sniff: (buf) =>
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

// Checks actual file content against known-safe raster signatures — see
// the comment above on why this (not the declared MIME type) is the real
// gate. Deliberately fails closed: anything unrecognized is rejected,
// including SVG, PDF, and arbitrary non-image files.
export function isSafeRasterImage(buffer: Buffer): boolean {
  return MAGIC_BYTES.some(({ sniff }) => {
    try {
      return sniff(buffer);
    } catch {
      return false;
    }
  });
}

// Auto-orients from EXIF, crops to a centered square, and re-encodes as
// WebP — small and fast-loading regardless of what format/size was
// uploaded. Metadata (EXIF, including any GPS tag) is stripped by default
// since we never call .withMetadata() — sharp's own documented default.
export async function processAvatarImage(input: Buffer): Promise<Buffer> {
  return sharp(input, {
    // Explicit even though these match sharp's own defaults: fail closed
    // on absurd pixel counts (decompression-bomb-shaped input) and don't
    // disable the built-in SVG/PNG memory-exhaustion safety features.
    limitInputPixels: true,
    unlimited: false,
  })
    .rotate()
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "attention" })
    .webp({ quality: 82 })
    .toBuffer();
}
