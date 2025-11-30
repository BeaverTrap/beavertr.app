import { auth } from "@/lib/auth";
import { getFriends } from "@/lib/friends";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friends = await getFriends(session.user.id);
  return NextResponse.json(friends);
}

