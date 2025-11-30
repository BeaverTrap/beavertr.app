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
      // Allow login to proceed - we'll handle database operations asynchronously
      // This prevents database errors from blocking authentication
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Store basic user info in token
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        
        // Try to sync with database in background (don't block on errors)
        // Use dynamic import to avoid loading database code at module initialization
        try {
          const email = user.email || `${user.id}@${account?.provider || 'unknown'}.local`;
          const { getOrCreateUser } = await import("@/lib/user");
          const dbUser = await getOrCreateUser(
            email,
            user.name || undefined,
            user.image || undefined
          );
          token.id = dbUser.id;
          
          // Save account info if available
          if (account) {
            try {
              const { db } = await import("@/lib/db");
              const { accounts } = await import("@/lib/schema");
              const { eq, and } = await import("drizzle-orm");
              const { randomUUID } = await import("crypto");

              const [existingAccount] = await db
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
                await db.insert(accounts).values({
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
              console.error("Error saving account to database:", dbError);
              // Don't throw - allow login to proceed
            }
          }
        } catch (error) {
          console.error("JWT callback error:", error);
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
