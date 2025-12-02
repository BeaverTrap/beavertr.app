import { NextResponse } from 'next/server';

export async function GET() {
  const errors: string[] = [];
  const results: any = {};

  // Test 1: Environment variables
  results.env = {
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlType: process.env.DATABASE_URL?.startsWith('libsql://') ? 'Turso' : 'Local',
    hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
  };

  // Test 2: Can we import NextAuth handlers?
  try {
    const { handlers } = await import('@/lib/auth');
    results.authHandlers = { success: true, hasGet: !!handlers.GET, hasPost: !!handlers.POST };
  } catch (error: any) {
    errors.push(`Auth handlers import failed: ${error.message}`);
    results.authHandlers = { success: false, error: error.message, stack: error.stack };
  }

  // Test 3: Can we import the auth function?
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    results.authFunction = { success: true, hasSession: !!session };
  } catch (error: any) {
    errors.push(`Auth function failed: ${error.message}`);
    results.authFunction = { success: false, error: error.message, stack: error.stack };
  }

  // Test 4: Can we connect to database?
  try {
    const { db } = await import('@/lib/db');
    const { users } = await import('@/lib/schema');
    const result = await (db as any).select().from(users).limit(1);
    results.database = { success: true, canQuery: true };
  } catch (error: any) {
    errors.push(`Database connection failed: ${error.message}`);
    results.database = { success: false, error: error.message, stack: error.stack };
  }

  // Test 5: Can we import getOrCreateUser?
  try {
    const { getOrCreateUser } = await import('@/lib/user');
    results.getOrCreateUser = { success: true, isFunction: typeof getOrCreateUser === 'function' };
  } catch (error: any) {
    errors.push(`getOrCreateUser import failed: ${error.message}`);
    results.getOrCreateUser = { success: false, error: error.message, stack: error.stack };
  }

  return NextResponse.json({
    success: errors.length === 0,
    errors,
    results,
    timestamp: new Date().toISOString(),
  });
}




