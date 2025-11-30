import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Try to find user by ID first, then by email if ID doesn't match
    let [user] = await (db as any)
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        bio: users.bio,
        image: users.image,
        amazonAffiliateTag: users.amazonAffiliateTag,
        shippingAddress: users.shippingAddress,
      })
      .from(users)
      .where(
        session.user.id && session.user.email
          ? or(eq(users.id, session.user.id), eq(users.email, session.user.email))
          : session.user.id
          ? eq(users.id, session.user.id)
          : eq(users.email, session.user.email!)
      )
      .limit(1);
    
    if (!user) {
      console.error("User not found in settings route:", {
        sessionId: session.user.id,
        sessionEmail: session.user.email
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    console.log("Settings route found user:", { id: user.id, email: user.email });
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const now = new Date();
    
    // Find user by ID or email
    const whereClause = session.user.id && session.user.email
      ? or(eq(users.id, session.user.id), eq(users.email, session.user.email))
      : session.user.id
      ? eq(users.id, session.user.id)
      : eq(users.email, session.user.email!);
    
    await db
      .update(users)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(whereClause);
    
    const [updated] = await db
      .select()
      .from(users)
      .where(whereClause)
      .limit(1);
    
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user settings" },
      { status: 500 }
    );
  }
}

