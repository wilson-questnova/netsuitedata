# Session Management and Automatic Logout

This document describes the enhanced session management system with automatic logout functionality implemented for the NetSuite Data Portal.

## Overview

The application now includes comprehensive session management with automatic logout capabilities to enhance security and prevent unauthorized access due to user inactivity.

## Features Implemented

### 1. Session-Based Authentication
- **HTTP Cookies**: Secure session cookies replace basic auth after initial login
- **Session Storage**: In-memory session store (production should use Redis/database)
- **Session IDs**: Cryptographically secure session identifiers

### 2. Automatic Logout Timers

#### Inactivity Timeout
- **Duration**: 30 minutes of inactivity
- **Tracking**: Monitors mouse movements, clicks, keyboard input, scrolling
- **Warning**: 5-minute warning before expiration
- **Action**: Automatic logout when timeout is reached

#### Maximum Session Duration
- **Duration**: 8 hours maximum session length
- **Enforcement**: Automatic logout regardless of activity
- **Security**: Prevents indefinite session persistence

### 3. User Experience Features

#### Session Warning Modal
- **Trigger**: Appears 5 minutes before session expiry
- **Countdown**: Real-time countdown timer
- **Options**: 
  - "Stay Logged In" - Extends session
  - "Logout Now" - Immediate logout

#### Session Expired Modal
- **Automatic Display**: When session expires
- **Auto-Redirect**: Refreshes page to trigger re-authentication
- **User Feedback**: Clear messaging about expiration reason

## Technical Implementation

### Session Configuration

```typescript
const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours
  WARNING_TIME: 5 * 60 * 1000, // 5 minutes warning
  CHECK_INTERVAL: 60 * 1000, // Check every minute
};
```

### Files Modified/Created

#### Core Session Management
- **`src/middleware.ts`** - Enhanced with session cookie handling
- **`src/components/SessionManager.tsx`** - Client-side session monitoring
- **`src/app/layout.tsx`** - Integrated SessionManager component

#### API Endpoints
- **`src/app/api/session-check/route.ts`** - Session validation endpoint
- **`src/app/api/extend-session/route.ts`** - Session extension endpoint

#### Documentation
- **`SESSION_MANAGEMENT.md`** - This comprehensive guide

### Session Flow

1. **Initial Authentication**:
   - User provides basic auth credentials
   - Server validates and creates session
   - Session cookie set with secure flags

2. **Subsequent Requests**:
   - Middleware checks session cookie first
   - Updates last activity timestamp
   - Validates session hasn't expired

3. **Activity Monitoring**:
   - Client tracks user interactions
   - Periodic server-side session validation
   - Warning displayed before expiration

4. **Session Expiration**:
   - Automatic cleanup of expired sessions
   - User redirected to re-authenticate
   - Clear session data and cookies

## Security Features

### Cookie Security
- **HttpOnly**: Prevents XSS access to session cookies
- **Secure**: HTTPS-only in production
- **SameSite**: CSRF protection
- **Expiration**: Automatic cookie expiry

### Session Validation
- **Server-Side**: All validation on server
- **Periodic Cleanup**: Expired sessions removed
- **Activity Tracking**: Real-time activity monitoring
- **Secure IDs**: Cryptographically secure session identifiers

### Data Protection
- **Memory Cleanup**: Local/session storage cleared on logout
- **Cookie Removal**: Session cookies deleted on expiry
- **Server Cleanup**: Expired sessions removed from store

## Configuration Options

### Timeout Durations
You can modify session timeouts in `src/middleware.ts`:

```typescript
const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // Adjust inactivity timeout
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000, // Adjust max session time
  SESSION_COOKIE_NAME: 'netsuite-session', // Cookie name
};
```

### Warning Timing
Adjust warning timing in `src/components/SessionManager.tsx`:

```typescript
const SESSION_CONFIG = {
  WARNING_TIME: 5 * 60 * 1000, // Warning time before expiry
  CHECK_INTERVAL: 60 * 1000, // How often to check session
};
```

## Production Considerations

### Session Store
- **Current**: In-memory (development only)
- **Production**: Use Redis or database
- **Scaling**: Shared session store for multiple servers

### Security Enhancements
- **HTTPS**: Always use HTTPS in production
- **Session Rotation**: Implement session ID rotation
- **Audit Logging**: Log session events
- **Rate Limiting**: Prevent session abuse

### Monitoring
- **Session Metrics**: Track session duration and activity
- **Security Events**: Monitor failed authentications
- **Performance**: Monitor session store performance

## Testing the Implementation

### Manual Testing

1. **Login and Activity**:
   ```bash
   # Start the server
   npm run dev
   
   # Navigate to http://localhost:3000
   # Login with credentials
   # Observe session behavior
   ```

2. **Inactivity Test**:
   - Login to the application
   - Wait 25 minutes without activity
   - Warning should appear at 25-minute mark
   - Session expires at 30 minutes

3. **Maximum Duration Test**:
   - Login and remain active
   - Session should expire after 8 hours regardless of activity

4. **Session Extension**:
   - Wait for warning modal
   - Click "Stay Logged In"
   - Session should be extended

### Automated Testing

```bash
# Test session endpoints
curl -c cookies.txt -u admin:netsuite2024secure http://localhost:3000
curl -b cookies.txt http://localhost:3000/api/session-check
curl -b cookies.txt -X POST http://localhost:3000/api/extend-session
```

## Troubleshooting

### Common Issues

1. **Session Not Persisting**:
   - Check cookie settings
   - Verify HTTPS in production
   - Check browser cookie policies

2. **Premature Expiration**:
   - Verify activity tracking events
   - Check server time synchronization
   - Review session configuration

3. **Warning Not Appearing**:
   - Check JavaScript console for errors
   - Verify SessionManager is properly integrated
   - Check API endpoint accessibility

### Debug Information

The middleware logs detailed session information:
- Session creation and validation
- Activity updates
- Expiration events
- Cleanup operations

## Future Enhancements

### Planned Features
- **Remember Me**: Optional extended sessions
- **Multiple Device Management**: Track and manage multiple sessions
- **Session Analytics**: Detailed usage analytics
- **Advanced Security**: Anomaly detection and risk scoring

### Integration Options
- **SSO Integration**: Single sign-on support
- **2FA Integration**: Two-factor authentication
- **LDAP/AD**: Enterprise directory integration
- **OAuth/OIDC**: Modern authentication protocols

This session management system provides a robust foundation for secure, user-friendly authentication with automatic logout capabilities that enhance both security and user experience.