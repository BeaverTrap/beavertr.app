import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reactions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

// GET - Fetch reactions for an item
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const allReactions = await db
      .select()
      .from(reactions)
      .where(eq(reactions.itemId, itemId));

    // Group reactions by type and count
    const reactionCounts: Record<string, number> = {};
    const userReactions: Record<string, string[]> = {}; // userId -> reaction types

    allReactions.forEach((reaction: { type: string; userId: string }) => {
      if (!reactionCounts[reaction.type]) {
        reactionCounts[reaction.type] = 0;
      }
      reactionCounts[reaction.type]++;

      if (!userReactions[reaction.userId]) {
        userReactions[reaction.userId] = [];
      }
      userReactions[reaction.userId].push(reaction.type);
    });

    return NextResponse.json({
      reactions: allReactions,
      counts: reactionCounts,
      userReactions,
    });
  } catch (error: any) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

// POST - Toggle a reaction (add if doesn't exist, remove if exists)
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { itemId, type } = body;

    if (!itemId || !type) {
      return NextResponse.json(
        { error: "itemId and type are required" },
        { status: 400 }
      );
    }

    // Check if reaction already exists
    const existing = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.itemId, itemId),
          eq(reactions.userId, session.user.id),
          eq(reactions.type, type)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Remove reaction
      await db
        .delete(reactions)
        .where(
          and(
            eq(reactions.itemId, itemId),
            eq(reactions.userId, session.user.id),
            eq(reactions.type, type)
          )
        );

      return NextResponse.json({ action: "removed", reaction: null });
    } else {
      // Add reaction
      const reactionId = nanoid();

      const newReaction = await db
        .insert(reactions)
        .values({
          id: reactionId,
          itemId,
          userId: session.user.id,
          type,
          createdAt: new Date(),
        })
        .returning();

      return NextResponse.json({ action: "added", reaction: newReaction[0] });
    }
  } catch (error: any) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle reaction" },
      { status: 500 }
    );
  }
}

