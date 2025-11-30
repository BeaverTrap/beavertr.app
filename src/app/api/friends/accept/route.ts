import { auth } from "@/lib/auth";
import { acceptFriendRequest } from "@/lib/friends";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendshipId } = await request.json();

  if (!friendshipId) {
    return NextResponse.json(
      { error: "Friendship ID is required" },
      { status: 400 }
    );
  }

  await acceptFriendRequest(friendshipId);
  return NextResponse.json({ success: true });
}

