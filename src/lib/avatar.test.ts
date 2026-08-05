import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  AVATAR_SIZE,
  isSafeRasterImage,
  processAvatarImage,
} from "@/lib/avatar";

async function makeTestImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 90, b: 50 },
    },
  })
    .png()
    .toBuffer();
}

describe("processAvatarImage", () => {
  it("converts a non-square PNG into a square WebP", async () => {
    const input = await makeTestImage(800, 400);
    const output = await processAvatarImage(input);

    const meta = await sharp(output).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(AVATAR_SIZE);
    expect(meta.height).toBe(AVATAR_SIZE);
  });

  it("upscales a small image to the standard avatar size", async () => {
    const input = await makeTestImage(64, 64);
    const output = await processAvatarImage(input);

    const meta = await sharp(output).metadata();
    expect(meta.width).toBe(AVATAR_SIZE);
    expect(meta.height).toBe(AVATAR_SIZE);
  });

  it("produces a meaningfully smaller file than an uncompressed equivalent", async () => {
    const input = await makeTestImage(AVATAR_SIZE, AVATAR_SIZE);
    const output = await processAvatarImage(input);
    expect(output.byteLength).toBeLessThan(input.byteLength);
  });

  it("rejects input that isn't a real image", async () => {
    await expect(
      processAvatarImage(Buffer.from("not an image")),
    ).rejects.toThrow();
  });

  it("strips EXIF metadata (e.g. GPS/camera info) from the output", async () => {
    const withExif = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .withExif({ IFD0: { Make: "TestCamera", Model: "PhoneX" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const output = await processAvatarImage(withExif);
    expect((await sharp(output).metadata()).exif).toBeUndefined();
  });
});

describe("isSafeRasterImage", () => {
  it("accepts real JPEG/PNG/GIF/WebP content", async () => {
    const png = await sharp({
      create: { width: 4, height: 4, channels: 3, background: "red" },
    })
      .png()
      .toBuffer();
    const jpeg = await sharp({
      create: { width: 4, height: 4, channels: 3, background: "red" },
    })
      .jpeg()
      .toBuffer();
    const webp = await sharp({
      create: { width: 4, height: 4, channels: 3, background: "red" },
    })
      .webp()
      .toBuffer();
    const gif = Buffer.from("GIF89a" + "\0".repeat(10));

    expect(isSafeRasterImage(png)).toBe(true);
    expect(isSafeRasterImage(jpeg)).toBe(true);
    expect(isSafeRasterImage(webp)).toBe(true);
    expect(isSafeRasterImage(gif)).toBe(true);
  });

  it("rejects SVG content even if it were mislabeled as a raster MIME type", () => {
    const maliciousSvg = Buffer.from(
      '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    expect(isSafeRasterImage(maliciousSvg)).toBe(false);
  });

  it("rejects arbitrary non-image bytes", () => {
    expect(isSafeRasterImage(Buffer.from("not an image at all"))).toBe(false);
    expect(isSafeRasterImage(Buffer.alloc(0))).toBe(false);
  });

  it("rejects a truncated/too-short buffer without throwing", () => {
    expect(isSafeRasterImage(Buffer.from([0xff]))).toBe(false);
  });
});
