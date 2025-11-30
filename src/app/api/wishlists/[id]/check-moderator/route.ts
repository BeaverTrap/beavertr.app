import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wishlists, friendships } from "@/lib/schema";
import { eq, and, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ isModerator: false });
    }

    const { id: wishlistId } = await params;
    
    // Get the wishlist to find the owner
    const [wishlist] = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.id, wishlistId))
      .limit(1);

    if (!wishlist) {
      return NextResponse.json({ isModerator: false });
    }

    const ownerId = wishlist.userId;
    const moderatorId = session.user.id;

    // Check if moderatorId is a moderator for ownerId
    const [friendship1] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, ownerId),
          eq(friendships.friendId, moderatorId),
          eq(friendships.relationshipType, 'moderator'),
          eq(friendships.status, 'accepted')
        )
      )
      .limit(1);
    
    const [friendship2] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, moderatorId),
          eq(friendships.friendId, ownerId),
          eq(friendships.relationshipType, 'moderator'),
          eq(friendships.status, 'accepted')
        )
      )
      .limit(1);

    const isModerator = !!(friendship1 || friendship2);

    return NextResponse.json({ isModerator });
  } catch (error: any) {
    console.error("Error checking moderator status:", error);
    return NextResponse.json({ isModerator: false });
  }
}

