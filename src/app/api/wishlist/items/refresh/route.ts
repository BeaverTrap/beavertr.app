import { auth } from "@/lib/auth";
import { updateWishlistItem } from "@/lib/wishlist";
import { scrapeProductData } from "@/app/api/scrape/route";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId, url } = await request.json();

  if (!itemId || !url) {
    return NextResponse.json(
      { error: "Item ID and URL are required" },
      { status: 400 }
    );
  }

  try {
    // Re-scrape the URL to get updated data
    const scrapedData = await scrapeProductData(url);
    
    // Log what we got for debugging
    console.log("Scraped data:", {
      hasTitle: !!scrapedData.title,
      hasImage: !!scrapedData.image,
      hasPrice: !!scrapedData.price,
      hasDescription: !!scrapedData.description,
      url,
    });
    
    // Update the item with new data (only update fields that have values)
    const updateData: any = {};
    if (scrapedData.title) updateData.title = scrapedData.title;
    if (scrapedData.image) updateData.image = scrapedData.image;
    if (scrapedData.price !== undefined) updateData.price = scrapedData.price;
    if (scrapedData.description) updateData.description = scrapedData.description;
    
    const updatedItem = await updateWishlistItem(session.user.id, itemId, updateData);
    
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("Error refreshing item:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      url,
    });
    return NextResponse.json(
      { error: error.message || "Failed to refresh item" },
      { status: 500 }
    );
  }
}

