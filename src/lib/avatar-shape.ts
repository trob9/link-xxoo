// Client-safe: no sharp/Node-only imports here. Used by both the client
// AvatarUploader component and server-rendered pages — keep it that way.
export const AVATAR_SHAPES = ["circle", "rounded", "square"] as const;
export type AvatarShape = (typeof AVATAR_SHAPES)[number];

// Border-radius (px) applied to a 96–112px avatar at typical render sizes —
// callers scale as needed via CSS, this is just the shape's identity.
export const AVATAR_SHAPE_RADIUS: Record<AvatarShape, number> = {
  circle: 9999,
  rounded: 22,
  square: 0,
};
