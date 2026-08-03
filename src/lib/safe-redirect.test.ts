import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("allows a normal relative path", () => {
    expect(safeRedirectPath("/dashboard/theme")).toBe("/dashboard/theme");
  });

  it("falls back to /dashboard when nothing is given", () => {
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
  });

  it("rejects an absolute URL to another origin (open redirect)", () => {
    expect(safeRedirectPath("https://evil.example/phish")).toBe("/dashboard");
    expect(safeRedirectPath("http://evil.example")).toBe("/dashboard");
  });

  it("rejects a protocol-relative URL (still off-origin)", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/dashboard");
  });

  it("rejects a path missing the leading slash", () => {
    expect(safeRedirectPath("dashboard")).toBe("/dashboard");
  });

  it("honors a custom fallback", () => {
    expect(safeRedirectPath("https://evil.example", "/login")).toBe("/login");
  });
});
