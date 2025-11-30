import { getWishlistByShareLink } from "@/lib/wishlists";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareLink: string }> }
) {
  try {
    const { shareLink } = await params;
    const session = await auth();
    const wishlist = await getWishlistByShareLink(shareLink);
    
    if (!wishlist) {
      return NextResponse.json(
        { error: "Wishlist not found" },
        { status: 404 }
      );
    }
    
    const isOwner = session?.user?.id === wishlist.userId;
    
    // Personal: only creator can see, even with share link
    if (wishlist.privacy === "personal" && !isOwner) {
      return NextResponse.json(
        { error: "This wishlist is personal and can only be viewed by its creator" },
        { status: 403 }
      );
    }
    
    // Private: only logged-in users can access via share link
    if (wishlist.privacy === "private" && !isOwner && !session) {
      return NextResponse.json(
        { error: "This wishlist is private. Please sign in to view it" },
        { status: 401 }
      );
    }
    
    // Public: anyone can access via share link
    // No restrictions needed
    
    return NextResponse.json(wishlist);
  } catch (error: any) {
    console.error("Error fetching wishlist by share link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

