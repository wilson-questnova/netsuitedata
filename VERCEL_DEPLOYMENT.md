# Vercel Deployment Guide

## 🚀 Pre-Deployment Setup for Vercel

Before pushing to GitHub and deploying to Vercel, you need to configure several important settings.

## 📋 Required Environment Variables

You'll need to set up the following environment variables in your Vercel project dashboard:

### 1. Authentication Variables
```bash
AUTH_USERNAME=admin
AUTH_PASSWORD=netsuite2024secure
```

### 2. Database Configuration

#### Option A: MySQL Database (Recommended for Production)
```bash
USE_SQLITE=false
NODE_ENV=production
DB_TYPE=mysql
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USERNAME=your-mysql-username
DB_PASSWORD=your-mysql-password
DB_DATABASE=your-database-name
DB_SYNCHRONIZE=false
DB_LOGGING=false
DATABASE_URL=mysql://username:password@host:port/database
```

#### Option B: SQLite (Development/Testing)
```bash
USE_SQLITE=true
NODE_ENV=production
```

## 🔧 Vercel Configuration

### 1. Create vercel.json

Create a `vercel.json` file in your project root with the following configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. Build Configuration

Your `next.config.ts` is already properly configured for Vercel deployment with:
- Webpack fallbacks for Node.js modules
- Ignored optional dependencies
- TypeORM compatibility settings

## 🗄️ Database Setup Options

### Option 1: PlanetScale (Recommended)
1. Create a free PlanetScale account
2. Create a new database
3. Get connection string from PlanetScale dashboard
4. Add to Vercel environment variables

### Option 2: Railway
1. Create Railway account
2. Deploy MySQL database
3. Get connection details
4. Configure in Vercel

### Option 3: Vercel Postgres
1. Enable Vercel Postgres in your project
2. Update TypeORM configuration for PostgreSQL
3. Modify entity files if needed

## 📝 Step-by-Step Deployment Process

### 1. Prepare Your Repository

```bash
# Ensure .env files are in .gitignore
echo ".env*" >> .gitignore

# Add and commit all changes
git add .
git commit -m "feat: add session management and prepare for Vercel deployment"

# Push to GitHub
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `netsuitedata`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Configure Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables:

```bash
# Authentication (Required)
AUTH_USERNAME=admin
AUTH_PASSWORD=your-secure-password

# Database (Choose one option)
# Option A: MySQL
USE_SQLITE=false
DB_TYPE=mysql
DATABASE_URL=mysql://user:pass@host:port/db
DB_SYNCHRONIZE=false

# Option B: SQLite (simpler but limited)
USE_SQLITE=true

# Environment
NODE_ENV=production
```

### 4. Deploy

1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Test your deployment

## 🔒 Security Considerations

### 1. Change Default Credentials
```bash
# Use strong, unique credentials
AUTH_USERNAME=your-admin-username
AUTH_PASSWORD=your-very-secure-password-2024!
```

### 2. Database Security
- Use SSL connections for MySQL
- Restrict database access to Vercel IPs
- Use strong database passwords
- Enable database firewall rules

### 3. Session Security
- Sessions are automatically secured with HttpOnly cookies
- HTTPS is enforced in production
- SameSite cookies prevent CSRF attacks

## 🧪 Testing Your Deployment

### 1. Basic Authentication Test
```bash
# Test authentication
curl -u admin:your-password https://your-app.vercel.app
```

### 2. Session Management Test
```bash
# Test session endpoints
curl https://your-app.vercel.app/api/session-check
curl -X POST https://your-app.vercel.app/api/extend-session
```

### 3. Database Connection Test
- Visit `/transactions` page
- Try importing data
- Check for any database errors in Vercel logs

## 🚨 Common Issues & Solutions

### 1. Build Failures

**Issue**: TypeORM dependencies causing build errors
**Solution**: Your `next.config.ts` already handles this with webpack ignore plugins

### 2. Database Connection Issues

**Issue**: "Connection refused" or timeout errors
**Solution**: 
- Verify DATABASE_URL format
- Check database server allows external connections
- Ensure firewall rules allow Vercel IPs

### 3. Authentication Not Working

**Issue**: 401 errors on all requests
**Solution**:
- Verify AUTH_USERNAME and AUTH_PASSWORD are set in Vercel
- Check environment variable names match exactly
- Ensure no trailing spaces in values

### 4. Session Management Issues

**Issue**: Sessions not persisting
**Solution**:
- Verify HTTPS is enabled (required for secure cookies)
- Check browser developer tools for cookie settings
- Ensure session endpoints are accessible

## 📊 Monitoring & Maintenance

### 1. Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Monitor function execution times
- Track error rates

### 2. Database Monitoring
- Monitor database connection pool usage
- Set up alerts for connection failures
- Regular backup schedules

### 3. Security Monitoring
- Monitor failed authentication attempts
- Set up alerts for unusual session patterns
- Regular security audits

## 🔄 Continuous Deployment

Once set up, Vercel will automatically:
1. Deploy on every push to main branch
2. Run build and tests
3. Update environment if deployment succeeds
4. Provide preview deployments for pull requests

## 📈 Performance Optimization

### 1. Database Optimization
- Use connection pooling
- Implement query caching
- Optimize database indexes

### 2. Next.js Optimization
- Enable static generation where possible
- Implement proper caching headers
- Optimize bundle size

### 3. Vercel Features
- Enable Edge Functions for better performance
- Use Vercel's CDN for static assets
- Implement proper caching strategies

---

## ✅ Pre-Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database connection tested
- [ ] Authentication credentials updated
- [ ] .env files added to .gitignore
- [ ] vercel.json created (optional but recommended)
- [ ] Build process tested locally
- [ ] Session management tested
- [ ] Security settings reviewed
- [ ] Monitoring configured

**Ready to deploy!** 🚀