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
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { wishlistId, url, affiliateUrl, title, image, price, description, priority, notes, itemType, category, tags, size, quantity } = body;

    console.log("Adding item with data:", {
      wishlistId,
      url: url?.substring(0, 50) + "...",
      hasTitle: !!title,
      hasImage: !!image,
      hasPrice: !!price,
    });

    if (!wishlistId || !url) {
      return NextResponse.json(
        { error: "Wishlist ID and URL are required" },
        { status: 400 }
      );
    }

    const item = await addWishlistItem(wishlistId, session.user.id, {
      title: title || "Untitled",
      url,
      affiliateUrl: affiliateUrl || null,
      image: image || null,
      price: price || null,
      description: description || null,
      priority: priority || 0,
      notes: notes || null,
      itemType: itemType || null,
      category: category || null,
      tags: tags || null,
      size: size || null,
      quantity: quantity || null,
    });
    
    console.log("Item added successfully:", item.id);
    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Error adding wishlist item:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Provide more specific error messages
    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json(
        { error: "Wishlist not found or you don't have permission to add items to it" },
        { status: 404 }
      );
    }
    
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: "This item already exists in the wishlist" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to add item to wishlist" },
      { status: 500 }
    );
  }
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

