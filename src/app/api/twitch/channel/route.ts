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

    // Find user
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
        { error: "Twitch account not connected" },
        { status: 404 }
      );
    }

    // Fetch channel info from Twitch API
    const twitchResponse = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Authorization": `Bearer ${twitchAccount.accessToken}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
      },
    });

    if (!twitchResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Twitch channel info" },
        { status: twitchResponse.status }
      );
    }

    const twitchData = await twitchResponse.json();
    
    return NextResponse.json({
      channel: twitchData.data?.[0] || null,
    });
  } catch (error: any) {
    console.error("Error fetching Twitch channel:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Twitch channel" },
      { status: 500 }
    );
  }
}

