import { auth } from "@/lib/auth";
import { getUserWishlists, createWishlist } from "@/lib/wishlists";
import { getDefaultWishlist } from "@/lib/wishlist";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Fetching wishlists for user ID:", session.user.id);
  console.log("Session email:", session.user.email);

  // Try to find user by session ID first, then by email if needed
  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/schema");
  const { eq, or } = await import("drizzle-orm");
  
  let userId = session.user.id;
  
  // If no wishlists found, try to find user by email and use that ID
  const wishlists = await getUserWishlists(userId);
  
  if (wishlists.length === 0 && session.user.email) {
    console.log("No wishlists found with session ID, trying to find user by email:", session.user.email);
    const [userByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    
    if (userByEmail && userByEmail.id !== userId) {
      console.log("Found user by email with different ID:", userByEmail.id);
      userId = userByEmail.id;
      const wishlistsByEmail = await getUserWishlists(userId);
      if (wishlistsByEmail.length > 0) {
        return NextResponse.json(wishlistsByEmail);
      }
    }
  }
  
  // If no wishlists, create a default one
  if (wishlists.length === 0) {
    const defaultWishlist = await getDefaultWishlist(userId);
    return NextResponse.json([defaultWishlist]);
  }
  
  return NextResponse.json(wishlists);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, privacy, icon, color, isDefault } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const wishlist = await createWishlist(session.user.id, {
      name: name.trim(),
      description,
      privacy,
      icon,
      color,
      isDefault,
    });
    
    return NextResponse.json(wishlist);
  } catch (error: any) {
    console.error("Error creating wishlist:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create wishlist" },
      { status: 500 }
    );
  }
}

