import { auth } from "@/lib/auth";
import { getPendingRequests } from "@/lib/friends";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await getPendingRequests(session.user.id);
  return NextResponse.json(requests);
}

