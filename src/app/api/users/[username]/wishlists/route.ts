import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, wishlists, friendships } from "@/lib/schema";
import { eq, or, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const session = await auth();
  
  // Decode username
  let decodedUsername = username;
  try {
    decodedUsername = decodeURIComponent(username);
  } catch (e) {
    decodedUsername = username;
  }

  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, decodedUsername), eq(users.id, decodedUsername)))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isOwner = session?.user?.id === user.id;
  
  // Check if viewer is a friend (if not owner)
  let isFriend = false;
  if (!isOwner && session?.user?.id) {
    const viewerId = session.user.id;
    const [friendship1] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, viewerId),
          eq(friendships.friendId, user.id),
          eq(friendships.status, 'accepted')
        )
      )
      .limit(1);
    
    const [friendship2] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, user.id),
          eq(friendships.friendId, viewerId),
          eq(friendships.status, 'accepted')
        )
      )
      .limit(1);

    isFriend = !!(friendship1 || friendship2);
  }

  // Get all wishlists for the user
  const allWishlists = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, user.id));

  // Filter based on privacy and viewer permissions
  const filteredWishlists = allWishlists.filter(wishlist => {
    if (isOwner) {
      // Owner can see all wishlists (public, private, personal)
      return true;
    }
    
    if (wishlist.privacy === 'public') {
      // Everyone can see public wishlists
      return true;
    }
    
    if (wishlist.privacy === 'private' && isFriend) {
      // Friends can see private wishlists
      return true;
    }
    
    if (wishlist.privacy === 'personal') {
      // Nobody except owner can see personal wishlists
      return false;
    }
    
    // Private wishlists are only visible to friends
    return false;
  });

  return NextResponse.json(filteredWishlists);
}

