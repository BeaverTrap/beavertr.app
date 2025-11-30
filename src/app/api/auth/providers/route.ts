import { NextResponse } from "next/server";

// This endpoint tells the client which providers are available
export async function GET() {
  const providers = {
    google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    twitch: !!process.env.TWITCH_CLIENT_ID && !!process.env.TWITCH_CLIENT_SECRET,
    steam: !!process.env.STEAM_API_KEY,
  };

  return NextResponse.json({ providers });
}

