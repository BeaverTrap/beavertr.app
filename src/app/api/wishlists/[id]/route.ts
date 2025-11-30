import { auth } from "@/lib/auth";
import { deleteWishlist, updateWishlist } from "@/lib/wishlists";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteWishlist(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting wishlist:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete wishlist" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();
    console.log("Updating wishlist:", { wishlistId: id, userId: session.user.id, data });
    const updated = await updateWishlist(id, session.user.id, data);
    console.log("Wishlist updated successfully:", updated);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating wishlist:", error);
    const { id } = await params;
    console.error("Error details:", { 
      wishlistId: id, 
      userId: session.user.id, 
      error: error.message 
    });
    return NextResponse.json(
      { error: error.message || "Failed to update wishlist" },
      { status: 500 }
    );
  }
}

