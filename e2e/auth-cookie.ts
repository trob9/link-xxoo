import { encode } from "next-auth/jwt";
import { TEST_USER } from "./constants";

export async function mintSessionCookie(profile: {
  userId: string;
  username: string;
}) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be set to mint a test session");

  const value = await encode({
    secret,
    salt: "authjs.session-token",
    token: {
      sub: TEST_USER.discordId,
      userId: profile.userId,
      username: profile.username,
      discordId: TEST_USER.discordId,
      name: TEST_USER.displayName,
    },
  });

  return {
    name: "authjs.session-token",
    value,
    url: "http://localhost:3000",
    httpOnly: true,
    sameSite: "Lax" as const,
  };
}
