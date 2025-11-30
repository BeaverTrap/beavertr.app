import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email if ID doesn't match
    const { users } = await import("@/lib/schema");
    let userId = session.user.id;
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user && session.user.email) {
      const [userByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);
      
      if (userByEmail) {
        userId = userByEmail.id;
      }
    }

    // Get all connected accounts for this user
    const connectedAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));

    // Format the response
    const accountsList = connectedAccounts.map((account: any) => ({
      provider: account.provider,
      type: account.type,
      providerAccountId: account.providerAccountId,
    }));

    return NextResponse.json({ accounts: accountsList });
  } catch (error: any) {
    console.error("Error fetching connected accounts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch connected accounts" },
      { status: 500 }
    );
  }
}

