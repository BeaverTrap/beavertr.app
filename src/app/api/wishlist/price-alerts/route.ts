import { auth } from "@/lib/auth";
import { createPriceAlert, getPriceAlerts, updatePriceAlert, deletePriceAlert } from "@/lib/wishlist";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json(
      { error: "Item ID is required" },
      { status: 400 }
    );
  }

  try {
    const alerts = await getPriceAlerts(itemId, session.user.id);
    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error("Error fetching price alerts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch price alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId, targetPrice, percentDrop } = await request.json();

  if (!itemId) {
    return NextResponse.json(
      { error: "Item ID is required" },
      { status: 400 }
    );
  }

  if (!targetPrice && !percentDrop) {
    return NextResponse.json(
      { error: "Either targetPrice or percentDrop is required" },
      { status: 400 }
    );
  }

  try {
    const alert = await createPriceAlert(itemId, session.user.id, {
      targetPrice,
      percentDrop,
    });
    return NextResponse.json(alert);
  } catch (error: any) {
    console.error("Error creating price alert:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create price alert" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { alertId, targetPrice, percentDrop, isActive } = await request.json();

  if (!alertId) {
    return NextResponse.json(
      { error: "Alert ID is required" },
      { status: 400 }
    );
  }

  try {
    const alert = await updatePriceAlert(alertId, session.user.id, {
      targetPrice,
      percentDrop,
      isActive,
    });
    return NextResponse.json(alert);
  } catch (error: any) {
    console.error("Error updating price alert:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update price alert" },
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
  const alertId = searchParams.get("alertId");

  if (!alertId) {
    return NextResponse.json(
      { error: "Alert ID is required" },
      { status: 400 }
    );
  }

  try {
    const deleted = await deletePriceAlert(alertId, session.user.id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error("Error deleting price alert:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete price alert" },
      { status: 500 }
    );
  }
}

