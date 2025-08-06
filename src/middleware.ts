import { NextRequest, NextResponse } from 'next/server';

// Session configuration
const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  SESSION_COOKIE_NAME: 'netsuite-session',
};

// Simple in-memory session store (in production, use Redis or database)
const sessionStore = new Map<string, {
  username: string;
  loginTime: number;
  lastActivity: number;
  sessionId: string;
}>();

/**
 * Generate a secure session ID
 */
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Check if session is valid and not expired
 */
function isSessionValid(sessionData: any): boolean {
  const now = Date.now();
  const timeSinceLogin = now - sessionData.loginTime;
  const timeSinceActivity = now - sessionData.lastActivity;
  
  // Check maximum session duration
  if (timeSinceLogin > SESSION_CONFIG.MAX_SESSION_DURATION) {
    console.log('🕐 Session expired: Maximum duration exceeded');
    return false;
  }
  
  // Check inactivity timeout
  if (timeSinceActivity > SESSION_CONFIG.INACTIVITY_TIMEOUT) {
    console.log('💤 Session expired: Inactivity timeout');
    return false;
  }
  
  return true;
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, sessionData] of sessionStore.entries()) {
    if (!isSessionValid(sessionData)) {
      sessionStore.delete(sessionId);
      console.log(`🗑️ Cleaned up expired session: ${sessionId}`);
    }
  }
}

export function middleware(request: NextRequest) {
  // Debug logging
  console.log(`🔒 Auth Request: ${request.method} ${request.nextUrl.pathname}`);
  
  // Clean up expired sessions periodically
  cleanupExpiredSessions();
  
  // Add robots.txt headers to prevent search engine indexing
  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
  
  // Skip authentication for API routes that might be needed for login and session management
  if (request.nextUrl.pathname.startsWith('/api/auth') || 
      request.nextUrl.pathname === '/api/session-check' ||
      request.nextUrl.pathname === '/api/extend-session') {
    console.log('⏭️ Skipping auth for API route');
    return response;
  }
  
  // Check for existing session cookie first
  const sessionCookie = request.cookies.get(SESSION_CONFIG.SESSION_COOKIE_NAME);
  
  if (sessionCookie) {
    const sessionData = sessionStore.get(sessionCookie.value);
    
    if (sessionData && isSessionValid(sessionData)) {
      // Update last activity time
      sessionData.lastActivity = Date.now();
      sessionStore.set(sessionCookie.value, sessionData);
      
      console.log(`✅ Valid session found for user: ${sessionData.username}`);
      
      // Refresh the session cookie
      response.cookies.set(SESSION_CONFIG.SESSION_COOKIE_NAME, sessionCookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_CONFIG.INACTIVITY_TIMEOUT / 1000, // Convert to seconds
      });
      
      return response;
    } else {
      // Session expired or invalid, remove it
      if (sessionData) {
        sessionStore.delete(sessionCookie.value);
      }
      console.log('🚫 Session expired or invalid');
    }
  }
  
  // No valid session, check for basic authentication
  const authHeader = request.headers.get('authorization');
  console.log(`🔑 Auth header present: ${!!authHeader}`);
  
  // Log user agent to help troubleshoot browser issues
  const userAgent = request.headers.get('user-agent') || 'unknown';
  console.log(`🌐 User Agent: ${userAgent.substring(0, 50)}...`);
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    const unauthorizedResponse = new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="NetSuite Data Access"',
        'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
      },
    });
    
    // Clear any invalid session cookie
    if (sessionCookie) {
      unauthorizedResponse.cookies.delete(SESSION_CONFIG.SESSION_COOKIE_NAME);
    }
    
    return unauthorizedResponse;
  }
  
  // Decode the basic auth credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  // Check credentials (you should use environment variables for production)
  const validUsername = process.env.AUTH_USERNAME || 'admin';
  const validPassword = process.env.AUTH_PASSWORD || 'secure123';
  
  if (username !== validUsername || password !== validPassword) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="NetSuite Data Access"',
        'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
      },
    });
  }
  
  // Authentication successful, create new session
  const sessionId = generateSessionId();
  const now = Date.now();
  
  const sessionData = {
    username,
    loginTime: now,
    lastActivity: now,
    sessionId,
  };
  
  sessionStore.set(sessionId, sessionData);
  
  console.log(`✅ Authentication successful, session created: ${sessionId}`);
  
  // Set session cookie
  response.cookies.set(SESSION_CONFIG.SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_CONFIG.INACTIVITY_TIMEOUT / 1000, // Convert to seconds
  });
  
  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};