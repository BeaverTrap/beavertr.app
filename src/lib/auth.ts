import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitch from "next-auth/providers/twitch";
import { getOrCreateUser } from "@/lib/user";

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
      try {
        let dbUser;
        
        // If no existing user found, create/find by email
        if (!dbUser) {
          const email = user.email || `${user.id}@${account?.provider || 'unknown'}.local`;
          dbUser = await getOrCreateUser(
            email,
            user.name || undefined,
            user.image || undefined
          );
        }
        
        // Save account with access token for API access
        if (account && dbUser) {
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
          } else {
            // Update existing account with new tokens
            await db
              .update(accounts)
              .set({
                userId: dbUser.id,
                refreshToken: ((account.refresh_token as string | undefined) || existingAccount.refreshToken) || null,
                accessToken: ((account.access_token as string | undefined) || existingAccount.accessToken) || null,
                expiresAt: account.expires_at ? Math.floor(account.expires_at as number) : existingAccount.expiresAt,
                tokenType: ((account.token_type as string | undefined) || existingAccount.tokenType) || null,
                scope: ((account.scope as string | undefined) || existingAccount.scope) || null,
              })
              .where(eq(accounts.id, existingAccount.id));
          }
        }
        
        return true;
      } catch (error: any) {
        console.error("SignIn error:", error);
        console.error("Error details:", {
          message: error?.message,
          stack: error?.stack,
          databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
          hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
        });
        // Don't block login on database errors - allow it to proceed
        // The error will be logged for debugging
        return true;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        try {
          const email = user.email || `${user.id}@${account?.provider || 'unknown'}.local`;
          const dbUser = await getOrCreateUser(
            email,
            user.name || undefined,
            user.image || undefined
          );
          token.id = dbUser.id;
          token.email = email;
        } catch (error) {
          console.error("JWT error:", error);
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
