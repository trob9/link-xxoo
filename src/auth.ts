import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

// Every provider we accept. Anything not in here is refused in signIn()
// below — a provider added to the array above but forgotten here would
// otherwise sign people in with no User row behind them.
const PROVIDERS = ["discord", "google"] as const;
type Provider = (typeof PROVIDERS)[number];

function isSupported(provider: string | undefined): provider is Provider {
  return PROVIDERS.includes(provider as Provider);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Discord({}), Google({})],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!isSupported(account?.provider) || !account?.providerAccountId) {
        return false;
      }

      // Keyed on the provider pair, never on email: two accounts sharing an
      // email address stay two accounts, so control of a mailbox is never
      // enough to reach a profile.
      await prisma.user.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        update: {
          providerAvatar: user.image ?? undefined,
          email: user.email ?? undefined,
        },
        create: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          providerAvatar: user.image ?? undefined,
          email: user.email ?? undefined,
        },
      });

      return true;
    },
    async jwt({ token, account }) {
      // Only present on the request that completes a sign-in; afterwards the
      // token carries userId and that is what every later lookup uses. That
      // ordering is why tokens issued before this became multi-provider keep
      // working — they already carry userId.
      if (isSupported(account?.provider) && account?.providerAccountId) {
        const user = await prisma.user.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          select: { id: true },
        });
        token.userId = user?.id;
      }

      if (token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          include: { profile: { select: { username: true } } },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.provider = dbUser.provider;
          token.username = dbUser.profile?.username ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.username = (token.username as string | null) ?? null;
        session.user.provider = token.provider as string;
      }
      return session;
    },
  },
});
