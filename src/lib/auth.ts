import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitch from "next-auth/providers/twitch";

const providers: any[] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
];

if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
  providers.push(
    Twitch({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  basePath: "/api/auth",
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      // CRITICAL FIX: Return true immediately - don't block on database
      // Database operations happen in JWT callback (non-blocking)
      // This prevents login from failing if database has issues
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        try {
          // Lazy import to avoid loading database at module initialization
          const { getOrCreateUser } = await import("@/lib/user");
          const email = user.email || `${user.id}@${account?.provider || 'unknown'}.local`;
          const dbUser = await getOrCreateUser(
            email,
            user.name || undefined,
            user.image || undefined
          );
          token.id = dbUser.id;
          token.email = email;

          // Save account info if available (non-blocking)
          if (account && dbUser) {
            try {
              const { getDbInstance } = await import("@/lib/db");
              const db = getDbInstance();
              const { accounts } = await import("@/lib/schema");
              const { eq, and } = await import("drizzle-orm");
              const { randomUUID } = await import("crypto");

              const [existingAccount] = await (db as any)
                .select()
                .from(accounts)
                .where(
                  and(
                    eq(accounts.provider, account.provider),
                    eq(accounts.providerAccountId, account.providerAccountId)
                  )
                )
                .limit(1);

              if (!existingAccount) {
                await (db as any).insert(accounts).values({
                  id: randomUUID(),
                  userId: dbUser.id,
                  type: account.type as string,
                  provider: account.provider as string,
                  providerAccountId: account.providerAccountId as string,
                  refreshToken: (account.refresh_token as string | undefined) || null,
                  accessToken: (account.access_token as string | undefined) || null,
                  expiresAt: account.expires_at ? Math.floor(account.expires_at as number) : null,
                  tokenType: (account.token_type as string | undefined) || null,
                  scope: (account.scope as string | undefined) || null,
                  idToken: (account.id_token as string | undefined) || null,
                  sessionState: (account.session_state as string | undefined) || null,
                });
              }
            } catch (dbError) {
              console.error("Error saving account:", dbError);
              // Don't throw - allow login to proceed
            }
          }
        } catch (error) {
          console.error("JWT error:", error);
          // Don't throw - allow login to proceed even if database fails
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
