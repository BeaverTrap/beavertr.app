import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL(`/api/auth/signin?callbackUrl=${encodeURIComponent(request.nextUrl.href)}`, request.url)
      );
    }

    // Redirect directly to NextAuth signin endpoint with provider
    // This will go straight to OAuth, bypassing the sign-in selection page
    const callbackUrl = `${request.nextUrl.origin}/profile`;
    const signInUrl = new URL(`/api/auth/signin/${provider}`, request.url);
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    
    return NextResponse.redirect(signInUrl);
  } catch (error: any) {
    console.error("Link account error:", error);
    return NextResponse.redirect(
      new URL(`/profile?error=${encodeURIComponent(error.message || "LinkFailed")}`, request.url)
    );
  }
}

