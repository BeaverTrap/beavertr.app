import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email if ID doesn't match
    let userId = session.user.id;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user && session.user.email) {
      const [userByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);
      
      if (userByEmail) {
        userId = userByEmail.id;
      }
    }

    // Get Twitch account with access token
    const [twitchAccount] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.provider, "twitch")
        )
      )
      .limit(1);

    if (!twitchAccount || !twitchAccount.accessToken) {
      return NextResponse.json(
        { error: "Twitch account not connected or no access token" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      accessToken: twitchAccount.accessToken,
      providerAccountId: twitchAccount.providerAccountId,
      expiresAt: twitchAccount.expiresAt,
    });
  } catch (error: any) {
    console.error("Error fetching Twitch token:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Twitch token" },
      { status: 500 }
    );
  }
}

