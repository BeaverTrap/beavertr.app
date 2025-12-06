import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test 1: Check if NextAuth can be imported
    let authImport = { success: false, error: null as any };
    try {
      const { auth } = await import('@/lib/auth');
      authImport = { success: true, error: null };
    } catch (error: any) {
      authImport = { 
        success: false, 
        error: { message: error?.message, stack: error?.stack } 
      };
    }

    // Test 2: Check environment variables
    const envCheck = {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
    };

    return NextResponse.json({
      success: true,
      authImport,
      envCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: {
        message: error?.message,
        stack: error?.stack,
      }
    }, { status: 500 });
  }
}







