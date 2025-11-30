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
        // Use user ID from OAuth provider as fallback
        token.id = user.id || `temp-${Date.now()}`;
        token.email = user.email || `${user.id}@${account?.provider || 'unknown'}.local`;
        
        // Try to sync with database in background - but don't block or crash on errors
        // This is completely optional - login works without it
        try {
          const { getOrCreateUser } = await import("@/lib/user");
          const email = user.email || `${user.id}@${account?.provider || 'unknown'}.local`;
          const dbUser = await getOrCreateUser(
            email,
            user.name || undefined,
            user.image || undefined
          );
          if (dbUser?.id) {
            token.id = dbUser.id;
          }
        } catch (error) {
          // Silently fail - use OAuth user ID instead
          console.error("JWT: Database sync failed (non-critical):", error);
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
