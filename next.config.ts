import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is only for the Docker image (see Dockerfile, which
  // sets DOCKER_BUILD=1) — `next start` used by local/test builds doesn't
  // work against a standalone build, so leave it off otherwise.
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      // Google profile pictures. Onboarding copies the provider's avatar URL
      // into Profile.avatarUrl, which the public page renders with
      // next/image — an unlisted host throws there rather than degrading.
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
