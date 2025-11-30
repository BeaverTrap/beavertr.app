import { auth } from "@/lib/auth";
import { getWishlistItems, addWishlistItem, deleteWishlistItem, updateWishlistItem, getDefaultWishlist } from "@/lib/wishlist";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getWishlistItems(session.user.id);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, title, image, price, description, priority, notes } = await request.json();

  if (!url) {
    return NextResponse.json(
      { error: "URL is required" },
      { status: 400 }
    );
  }

  // Get or create default wishlist for the user
  const defaultWishlist = await getDefaultWishlist(session.user.id);

  const item = await addWishlistItem(defaultWishlist.id, session.user.id, {
    title: title || "Untitled",
    url,
    image,
    price,
    description,
    priority,
    notes,
  });
  
  return NextResponse.json(item);
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



