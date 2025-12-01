import { auth } from "@/lib/auth";
import { getDefaultWishlist, addWishlistItem, getWishlistItems, deleteWishlistItem, updateWishlistItem } from "@/lib/wishlist";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const wishlistId = searchParams.get("wishlistId");

  if (!wishlistId) {
    return NextResponse.json(
      { error: "Wishlist ID is required" },
      { status: 400 }
    );
  }

  // TODO: Check privacy and permissions
  const items = await getWishlistItems(wishlistId);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { wishlistId, url, affiliateUrl, title, image, price, description, priority, notes, itemType, size, quantity } = await request.json();

  if (!wishlistId || !url) {
    return NextResponse.json(
      { error: "Wishlist ID and URL are required" },
      { status: 400 }
    );
  }

  const item = await addWishlistItem(wishlistId, session.user.id, {
    title: title || "Untitled",
    url,
    affiliateUrl,
    image,
    price,
    description,
    priority,
    notes,
    itemType,
    size,
    quantity,
  });
  
  return NextResponse.json(item);
}

export async function DELETE(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const success = await deleteWishlistItem(session.user.id, id);
  if (!success) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ...updates } = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: "ID is required" },
      { status: 400 }
    );
  }

  const item = await updateWishlistItem(session.user.id, id, updates);
  return NextResponse.json(item);
}

