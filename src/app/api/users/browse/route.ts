import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, wishlists } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  // Get all users who have public wishlists
  // Make sure we're checking for 'public' string value
  const publicWishlists = await db
    .select({ userId: wishlists.userId })
    .from(wishlists)
    .where(eq(wishlists.privacy, 'public'));
  
  console.log("Public wishlists found:", publicWishlists.length);
  
  const userIds = [...new Set(publicWishlists.map((w: any) => w.userId))];
  
  if (userIds.length === 0) {
    console.log("No users with public wishlists");
    return NextResponse.json([]);
  }
  
  // Exclude current user
  const filteredUserIds = session?.user?.id 
    ? userIds.filter(id => id !== session.user.id)
    : userIds;
  
  if (filteredUserIds.length === 0) {
    console.log("No other users with public wishlists");
    return NextResponse.json([]);
  }
  
  // Get user details
  const publicUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      username: users.username,
    })
    .from(users)
    .where(inArray(users.id, filteredUserIds as string[]));
  
  console.log("Public users:", publicUsers.length);
  
  return NextResponse.json(publicUsers);
}

