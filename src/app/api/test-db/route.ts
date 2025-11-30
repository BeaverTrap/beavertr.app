import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';

export async function GET() {
  try {
    // Test database connection
    const result = await db.select().from(users).limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount: result.length,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      databaseUrl: process.env.DATABASE_URL || 'Not set',
      hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
    }, { status: 500 });
  }
}


