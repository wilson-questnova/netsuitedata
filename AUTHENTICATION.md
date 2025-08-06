# Authentication Setup for NetSuite Data Portal

This application now includes basic authentication to prevent unauthorized access and search engine indexing.

## Security Features Implemented

### 1. Basic HTTP Authentication
- All routes are protected with HTTP Basic Authentication
- Credentials are stored in environment variables
- Default fallback credentials are provided for development

### 2. Search Engine Protection
- `robots.txt` file blocks all web crawlers
- `X-Robots-Tag` headers prevent indexing
- Metadata configured to prevent search engine indexing

### 3. Environment Variables
- Credentials stored in `.env.local` (not committed to git)
- Secure credential management

## Configuration

### Setting Up Credentials

1. The application uses credentials from `.env.local`:
   ```
   AUTH_USERNAME=admin
   AUTH_PASSWORD=netsuite2024secure
   ```

2. **For Production**: Change these credentials to secure values

3. **Default Fallback**: If environment variables are not set:
   - Username: `admin`
   - Password: `netsuite2024secure`

### Accessing the Application

1. Navigate to the application URL
2. Browser will prompt for username and password
3. Enter the configured credentials
4. Access will be granted for the session

## Security Considerations

### For Production Deployment:

1. **Change Default Credentials**:
   ```bash
   # Update .env.local with strong credentials
   AUTH_USERNAME=your_secure_username
   AUTH_PASSWORD=your_very_secure_password_123!
   ```

2. **HTTPS Required**: Always use HTTPS in production to encrypt credentials

3. **Regular Password Updates**: Change passwords regularly

4. **Access Logging**: Consider implementing access logging for security monitoring

## Files Modified/Created

- `src/middleware.ts` - Main authentication logic (moved to src directory for Next.js 15 compatibility)
- `.env.local` - Environment variables (not in git)
- `public/robots.txt` - Search engine blocking
- `src/app/layout.tsx` - Updated metadata for SEO blocking
- `.gitignore` - Already configured to ignore .env files

## Testing Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. You should see a browser authentication prompt

4. Enter the credentials from `.env.local`

5. Access should be granted

## Troubleshooting

- **Authentication not working**: Check `.env.local` file exists and has correct format
- **Still being indexed**: Verify `robots.txt` is accessible at `/robots.txt`
- **Credentials not recognized**: Restart the development server after changing `.env.local`

## Additional Security Recommendations

1. **IP Whitelisting**: Consider adding IP-based restrictions
2. **Session Management**: Implement proper session handling for better UX
3. **Two-Factor Authentication**: For enhanced security
4. **Audit Logging**: Track access attempts and successful logins