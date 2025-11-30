import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // Next.js already decodes URL parameters, but handle both encoded and decoded cases
    let decodedUsername = username;
    try {
      // Try decoding - if it's already decoded, this will just return the same string
      decodedUsername = decodeURIComponent(username);
    } catch (e) {
      // If decoding fails, use the original
      decodedUsername = username;
    }
    
    console.log("API: Looking up user with identifier:", { original: username, decoded: decodedUsername });

    // Try to find by username first, then by id
    let [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, decodedUsername), eq(users.id, decodedUsername)))
      .limit(1);

    // If not found and it looks like an email, try that too
    if (!user && decodedUsername.includes('@')) {
      console.log("API: Trying to find by email:", decodedUsername);
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, decodedUsername))
        .limit(1);
    }
    
    // If still not found and it's a UUID (likely a session ID that doesn't match), 
    // try to get the current session and find user by email
    if (!user && decodedUsername.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log("API: UUID not found, trying to find by session email");
      const { auth } = await import("@/lib/auth");
      const session = await auth();
      if (session?.user?.email) {
        console.log("API: Session email:", session.user.email);
        [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, session.user.email))
          .limit(1);
        if (user) {
          console.log("API: Found user by session email:", user.id);
        } else {
          console.error("API: User not found even by email:", session.user.email);
        }
      } else {
        console.error("API: No session email available");
      }
    }

    if (!user) {
      console.error("API: User not found for identifier:", decodedUsername);
      // Debug: try to see what users exist
      const allUsers = await db.select({ id: users.id, username: users.username, email: users.email }).from(users).limit(5);
      console.error("API: Available users:", allUsers);
      console.error("API: Tried to find:", { original: username, decoded: decodedUsername });
      
      // Return a more detailed error
      return NextResponse.json({ 
        error: "User not found", 
        identifier: decodedUsername,
        message: `No user found with identifier: ${decodedUsername}`,
        availableUsers: allUsers.map((u: any) => ({ id: u.id, username: u.username, email: u.email }))
      }, { status: 404 });
    }

    console.log("API: Found user:", { id: user.id, username: user.username, email: user.email });
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("API: Error in GET /api/users/[username]:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error.message || "An error occurred while fetching user",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

