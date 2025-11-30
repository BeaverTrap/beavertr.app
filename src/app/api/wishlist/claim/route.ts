import { auth } from "@/lib/auth";
import { claimItem, purchaseItem, unclaimItem, confirmClaim, unpurchaseItem, markAsPurchased, verifyProof } from "@/lib/wishlist";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { 
    itemId, 
    action, 
    confirm,
    purchaseDate,
    trackingNumber,
    purchaseNotes,
    purchaseAmount,
    purchaseProof,
    isAnonymous,
  } = await request.json();

  if (!itemId || !action) {
    return NextResponse.json(
      { error: "Item ID and action are required" },
      { status: 400 }
    );
  }

  try {
    if (action === "claim") {
      await claimItem(itemId, session.user.id);
    } else if (action === "purchase") {
      await purchaseItem(itemId, session.user.id);
    } else if (action === "unclaim") {
      await unclaimItem(itemId);
    } else if (action === "confirm") {
      // Owner confirming or rejecting a claim
      await confirmClaim(itemId, session.user.id, confirm === true);
    } else if (action === "unpurchase") {
      // Owner unmarking item as purchased
      await unpurchaseItem(itemId, session.user.id);
    } else if (action === "markPurchased") {
      // Claimer marking item as purchased with proof
      await markAsPurchased(itemId, session.user.id, {
        purchaseProof,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        trackingNumber,
        purchaseNotes,
        purchaseAmount,
        isAnonymous: isAnonymous === true,
      });
    } else if (action === "verifyProof") {
      // Owner verifying or rejecting purchase proof
      await verifyProof(itemId, session.user.id, confirm === true);
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update item" },
      { status: 500 }
    );
  }
}

