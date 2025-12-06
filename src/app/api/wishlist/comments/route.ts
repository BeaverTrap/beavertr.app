import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

// GET - Fetch comments for an item
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const allComments = await db
      .select()
      .from(comments)
      .where(eq(comments.itemId, itemId))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json({ comments: allComments });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { itemId, content, parentId } = body;

    if (!itemId || !content) {
      return NextResponse.json(
        { error: "itemId and content are required" },
        { status: 400 }
      );
    }

    const commentId = nanoid();

    const newComment = await db
      .insert(comments)
      .values({
        id: commentId,
        itemId,
        userId: session.user.id,
        content: content.trim(),
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ comment: newComment[0] });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create comment" },
      { status: 500 }
    );
  }
}

// PATCH - Update a comment
export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId || !content) {
      return NextResponse.json(
        { error: "commentId and content are required" },
        { status: 400 }
      );
    }

    // Check if user owns the comment
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existingComment[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await db
      .update(comments)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning();

    return NextResponse.json({ comment: updated[0] });
  } catch (error: any) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment
export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    // Check if user owns the comment
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existingComment[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await db.delete(comments).where(eq(comments.id, commentId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete comment" },
      { status: 500 }
    );
  }
}




