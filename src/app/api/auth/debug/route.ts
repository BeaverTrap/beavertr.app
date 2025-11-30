import { NextResponse } from "next/server";

export async function GET() {
  // This will help us see what's actually loaded
  const providers = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING",
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID ? "SET" : "MISSING",
      clientSecret: process.env.TWITCH_CLIENT_SECRET ? "SET" : "MISSING",
    },
  };

  try {
    // Try to import and check providers
    const { handlers } = await import("@/lib/auth");
    return NextResponse.json({
      status: "OK",
      providers,
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
      },
      handlersExist: !!handlers,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "ERROR",
      error: error.message,
      stack: error.stack,
      providers,
    }, { status: 500 });
  }
}

