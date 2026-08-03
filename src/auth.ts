import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Discord({})],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "discord" || !account.providerAccountId) {
        return false;
      }

      await prisma.user.upsert({
        where: { discordId: account.providerAccountId },
        update: {
          discordAvatar: user.image ?? undefined,
          email: user.email ?? undefined,
        },
        create: {
          discordId: account.providerAccountId,
          discordAvatar: user.image ?? undefined,
          email: user.email ?? undefined,
        },
      });

      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "discord" && account.providerAccountId) {
        token.discordId = account.providerAccountId;
      }

      if (token.discordId) {
        const dbUser = await prisma.user.findUnique({
          where: { discordId: token.discordId as string },
          include: { profile: { select: { username: true } } },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.username = dbUser.profile?.username ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.username = (token.username as string | null) ?? null;
        session.user.discordId = token.discordId as string;
      }
      return session;
    },
  },
});
