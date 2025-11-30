import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test 1: Check environment variables
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlType: process.env.DATABASE_URL?.startsWith('libsql://') ? 'Turso' : 'Other',
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
    };

    // Test 2: Try to import and initialize database
    let dbTest = { success: false, error: null as any };
    try {
      const { db } = await import('@/lib/db');
      const { users } = await import('@/lib/schema');
      const result = await db.select().from(users).limit(1);
      dbTest = { success: true, error: null, userCount: result.length };
    } catch (dbError: any) {
      dbTest = { 
        success: false, 
        error: {
          message: dbError?.message,
          stack: dbError?.stack,
          name: dbError?.name,
        }
      };
    }

    // Test 3: Try to import NextAuth
    let authTest = { success: false, error: null as any };
    try {
      const { auth } = await import('@/lib/auth');
      const session = await auth();
      authTest = { 
        success: true, 
        error: null,
        hasSession: !!session,
      };
    } catch (authError: any) {
      authTest = { 
        success: false, 
        error: {
          message: authError?.message,
          stack: authError?.stack,
          name: authError?.name,
        }
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
      envCheck,
      dbTest,
      authTest,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      }
    }, { status: 500 });
  }
}

