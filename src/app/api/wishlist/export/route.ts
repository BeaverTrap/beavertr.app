import { auth } from "@/lib/auth";
import { getWishlistItems } from "@/lib/wishlist";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const wishlistId = searchParams.get("wishlistId");
  const format = searchParams.get("format") || "csv";

  if (!wishlistId) {
    return NextResponse.json(
      { error: "Wishlist ID is required" },
      { status: 400 }
    );
  }

  const items = await getWishlistItems(wishlistId);

  if (format === "csv") {
    // Generate CSV
    const headers = ["Title", "URL", "Price", "Category", "Size", "Quantity", "Priority", "Status", "Notes"];                                            
    const rows = items.map((item: any) => [
      `"${(item.title || "").replace(/"/g, '""')}"`,
      item.url || "",
      item.price || "",
      item.category || "",
      item.size || "",
      item.quantity || "",
      item.priority || 0,
      item.isPurchased ? "Purchased" : item.isClaimed ? "Claimed" : "Available",
      `"${(item.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: string[]) => row.join(","))
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="wishlist-${wishlistId}.csv"`,
      },
    });
  }

  // JSON format
  return NextResponse.json(items, {
    headers: {
      "Content-Disposition": `attachment; filename="wishlist-${wishlistId}.json"`,
    },
  });
}



