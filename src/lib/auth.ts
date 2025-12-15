import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitch from "next-auth/providers/twitch";
import type { Provider } from "next-auth/providers";
import { getOrCreateUser } from "@/lib/user";

const providers: Provider[] = [
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
        // Check if user is already signed in (account linking)
        const session = await auth();
        let dbUser;
        
        if (session?.user?.id) {
          // User is already signed in - link account to existing user
          const { db } = await import("@/lib/db");
          const { users } = await import("@/lib/schema");
          const { eq } = await import("drizzle-orm");
          
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);
          
          if (existingUser) {
            dbUser = existingUser;
          } else if (session.user.email) {
            // Fallback to email if ID doesn't match
            const [userByEmail] = await db
              .select()
              .from(users)
              .where(eq(users.email, session.user.email))
              .limit(1);
            if (userByEmail) {
              dbUser = userByEmail;
            }
          }
        }
        
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
              type: String(account.type),
              provider: String(account.provider),
              providerAccountId: String(account.providerAccountId),
              refreshToken: account.refresh_token ? String(account.refresh_token) : null,
              accessToken: account.access_token ? String(account.access_token) : null,
              expiresAt: account.expires_at ? new Date(account.expires_at * 1000).getTime() : null,
              tokenType: account.token_type ? String(account.token_type) : null,
              scope: account.scope ? (Array.isArray(account.scope) ? account.scope.join(' ') : String(account.scope)) : null,
              idToken: account.id_token ? String(account.id_token) : null,
              sessionState: account.session_state ? String(account.session_state) : null,
            });
          } else {
            // Update existing account with new tokens
            await db
              .update(accounts)
              .set({
                userId: dbUser.id,
                refreshToken: account.refresh_token || existingAccount.refreshToken,
                accessToken: account.access_token || existingAccount.accessToken,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000).getTime() : existingAccount.expiresAt,
                tokenType: account.token_type || existingAccount.tokenType,
                scope: account.scope || existingAccount.scope,
              })
              .where(eq(accounts.id, existingAccount.id));
          }
        }
        
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
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
