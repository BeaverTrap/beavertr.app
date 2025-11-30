import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, friendships } from "@/lib/schema";
import { eq, or, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ isFriend: false });
    }

    const { username } = await params;
    
    // Decode username
    let decodedUsername = username;
    try {
      decodedUsername = decodeURIComponent(username);
    } catch (e) {
      decodedUsername = username;
    }

    // Find the target user
    const [targetUser] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, decodedUsername), eq(users.id, decodedUsername)))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ isFriend: false });
    }

    const viewerId = session.user.id;
    const targetUserId = targetUser.id;

    // Check if viewer is friends with target user
    const [friendship1] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, viewerId),
          eq(friendships.friendId, targetUserId),
          eq(friendships.status, 'accepted')
        )
      )
      .limit(1);
    
    const [friendship2] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, targetUserId),
          eq(friendships.friendId, viewerId),
          eq(friendships.status, 'accepted')
        )
      )
      .limit(1);

    const isFriend = !!(friendship1 || friendship2);

    return NextResponse.json({ isFriend });
  } catch (error: any) {
    console.error("Error checking friendship:", error);
    return NextResponse.json({ isFriend: false });
  }
}

