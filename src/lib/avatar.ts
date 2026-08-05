import sharp from "sharp";

// Server-only (imports sharp, a native Node module) — never import this
// from a client component. Shape constants live in ./avatar-shape instead,
// which is safe for both client and server.
export const AVATAR_MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB, before processing
export const AVATAR_SIZE = 512; // stored square size in px

// Auto-orients from EXIF, crops to a centered square, and re-encodes as
// WebP — small and fast-loading regardless of what format/size was
// uploaded.
export async function processAvatarImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "attention" })
    .webp({ quality: 82 })
    .toBuffer();
}
