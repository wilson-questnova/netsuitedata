import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/session-check
 * Checks if the current session is valid
 * Returns 200 if session is valid, 401 if expired or invalid
 */
export async function GET(request: NextRequest) {
  try {
    // The middleware will handle session validation
    // If we reach this point, the session is valid
    return NextResponse.json({ 
      status: 'valid',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Session check failed' },
      { status: 500 }
    );
  }
}