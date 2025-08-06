import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/extend-session
 * Extends the current session by updating the last activity time
 * This endpoint relies on the middleware to handle session validation and extension
 */
export async function POST() {
  try {
    // The middleware will handle session validation and extension
    // If we reach this point, the session has been extended
    return NextResponse.json({ 
      status: 'extended',
      message: 'Session extended successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Session extension error:', error);
    return NextResponse.json(
      { error: 'Failed to extend session' },
      { status: 500 }
    );
  }
}