# Cross-Domain Authentication Fix Documentation

## Overview
This document outlines the changes made to fix JWT token storage and cross-domain redirection issues between the Vercel frontend and remote backend server.

## Problem Summary
- JWT tokens were not being stored in the browser when the frontend and backend are on different domains
- Redirection failed after authentication
- CORS configuration was hardcoded instead of using environment variables

## Solution Implemented

### 1. Backend CORS Configuration (`src/app.js`)
**Changes:**
- Updated CORS configuration to dynamically include `FRONTEND_URL` from environment variables
- Maintains support for local development URLs (localhost:3000, localhost:5173)
- Uses `credentials: true` to allow cookies to be sent across domains

**Before:**
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://invitation-frontend-five.vercel.app',   // Hardcoded
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
```

**After:**
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
];

// Add FRONTEND_URL from environment if available
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
```

### 2. Cookie Settings (`src/controllers/authController.js`)
**Changes:**
- Made cookie security settings conditional based on `NODE_ENV`
- In **development**: `secure: false`, `sameSite: 'lax'` (allows HTTP)
- In **production**: `secure: true`, `sameSite: 'none'` (requires HTTPS)
- Applied to all authentication methods: `register`, `login`, `logout`, `googleCallback`

**Before:**
```javascript
const cookieOptions = {
  httpOnly: true,
  secure: true,           // Always true
  sameSite: 'none',       // Always 'none'
  maxAge: 24 * 60 * 60 * 1000
};
```

**After:**
```javascript
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000
};
```

### 3. Environment Variables (`.env`)
**Changes:**
- Added `NODE_ENV` variable to control production vs development behavior
- Verified `FRONTEND_URL` is set correctly
- Verified `BASE_URL` is set for proper redirects

**Required Variables:**
```env
NODE_ENV="production"              # Set to "production" on production server
FRONTEND_URL="https://your-vercel-app.vercel.app"  # Your exact Vercel deployment URL
BASE_URL="https://your-backend-url.com"             # Your backend URL
JWT_SECRET="your-secret-key"
DATABASE_URL="your-database-url"
# ... other variables ...
```

## Deployment Instructions

### For Development (Local Testing)
1. Keep `NODE_ENV="development"` in `.env`
2. Use `FRONTEND_URL="http://localhost:3000"` or `http://localhost:5173`
3. Cookies will use `secure: false` and `sameSite: 'lax'`

### For Production (Remote Server)

#### 1. **Update Environment Variables**
```bash
# SSH into your production server
ssh user@your-backend-server

# Edit .env file
NODE_ENV="production"
FRONTEND_URL="https://your-exact-vercel-url.vercel.app"  # CRITICAL: No trailing slash, exact URL
BASE_URL="https://your-backend-url.com"
```

#### 2. **Ensure HTTPS**
- ⚠️ **CRITICAL**: Production backend MUST be served over HTTPS
- Self-signed certificates will NOT work for cross-domain cookies
- Use a proper SSL certificate (Let's Encrypt, etc.)
- Test with: `curl -I https://your-backend-url.com`

#### 3. **Restart Application**
```bash
# Restart your Node.js application
# The method depends on your deployment (PM2, systemd, Docker, etc.)

# Example with PM2:
pm2 restart app
pm2 logs

# Example with systemd:
sudo systemctl restart your-app
sudo journalctl -u your-app -f

# Example with Docker:
docker-compose restart server
docker-compose logs -f server
```

## Verification Checklist

### Backend Verification

#### 1. Check CORS Headers
```bash
curl -H "Origin: https://your-vercel-app.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://your-backend-url.com/api/auth/login -v
```

Expected response headers:
```
Access-Control-Allow-Origin: https://your-vercel-app.vercel.app
Access-Control-Allow-Credentials: true
```

#### 2. Check Cookie Headers in Login Response
```bash
curl -i -X POST https://your-backend-url.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
```

Expected response headers:
```
Set-Cookie: token=eyJhbGc...; Path=/; HttpOnly; Secure; SameSite=None
```

#### 3. Check Environment Variables
```bash
# SSH into server
npm list dotenv
cat .env | grep -E "NODE_ENV|FRONTEND_URL|BASE_URL"
```

### Frontend Verification (Browser)

#### 1. **Login Test**
1. Open your Vercel deployment in the browser
2. Go to Login page
3. Open Developer Tools (F12)
4. Go to **Application** → **Cookies**
5. Click the login button
6. After successful login, verify:
   - ✅ A `token` cookie appears in the Cookies section
   - ✅ Cookie has `HttpOnly` flag
   - ✅ Cookie has `Secure` flag (production only)
   - ✅ Cookie domain is correct

#### 2. **Network Tab Inspection**
1. Open DevTools → **Network** tab
2. Clear existing cookies (Application → Cookies → Select all → Delete)
3. Perform login
4. Click on the POST request to `/api/auth/login`
5. Go to **Response Headers** tab
6. Verify: `set-cookie: token=...` is present

#### 3. **Redirection Test**
1. After successful login, verify:
   - ✅ Page redirects to `/auth/callback` or dashboard
   - ✅ No errors in Console tab
   - ✅ Token cookie is automatically sent on subsequent requests

#### 4. **Cross-Browser Testing**
Test login on multiple browsers:
- Google Chrome ✓
- Brave Browser ✓
- Mozilla Firefox ✓
- Safari (if on macOS) ✓

### Troubleshooting

#### Issue: Cookie not appearing in browser
**Possible causes:**
1. Backend not HTTPS in production
   - Solution: Ensure `NODE_ENV=production` and backend has valid SSL cert
2. FRONTEND_URL not in CORS origins
   - Solution: Check exact FRONTEND_URL (no trailing slash, exact match)
3. Cookie options mismatched between set and clear
   - Solution: Verify all cookie settings are identical

#### Issue: CORS error in console
**Possible causes:**
1. FRONTEND_URL not configured
   - Solution: Add exact Vercel URL to `FRONTEND_URL` env variable
2. `credentials: true` missing in CORS
   - Solution: Already fixed in code, verify it's deployed

#### Issue: Token sent but not validated
**Possible causes:**
1. Cookie not being sent with requests
   - Solution: Ensure frontend sends `credentials: 'include'` in fetch/axios
2. JWT_SECRET mismatch
   - Solution: Verify same `JWT_SECRET` on backend

#### Issue: "Error: Can't set headers after they are sent"
**Possible causes:**
1. Cookie set twice or response sent before cookie
   - Solution: Check authController doesn't call res.json() before res.cookie()

## Code Changes Summary

### Files Modified:
1. **src/app.js** - CORS configuration
2. **src/controllers/authController.js** - Cookie settings in 4 methods
3. **.env** - Added NODE_ENV variable

### Changes Made:
- ✅ Dynamic CORS origin configuration using environment variables
- ✅ Conditional secure cookie flags based on NODE_ENV
- ✅ Production-ready SameSite=None configuration
- ✅ Development-friendly settings for local testing
- ✅ Consistent cookie settings across all auth methods

## Important Warnings

⚠️ **HTTPS Requirement**
- `sameSite: 'none'` with cross-domain cookies REQUIRES HTTPS
- Without HTTPS, browsers will reject the cookie
- Test with: `curl -I https://your-backend.com`

⚠️ **No Trailing Slash in FRONTEND_URL**
- ❌ Wrong: `https://your-app.vercel.app/`
- ✅ Correct: `https://your-app.vercel.app`

⚠️ **Exact URL Matching**
- CORS origin matching is case-sensitive
- Must include protocol (https://)
- Must NOT include subdirectories

## Next Steps

1. ✅ Deploy code changes to production server
2. ✅ Update `NODE_ENV=production` in production `.env`
3. ✅ Update `FRONTEND_URL` with your exact Vercel deployment URL
4. ✅ Restart application
5. ✅ Run verification checklist above
6. ✅ Test login flow from Vercel deployment
7. ✅ Monitor logs for any authentication errors

## Support

If issues persist after deployment:
1. Check backend logs: `docker-compose logs backend` or `pm2 logs`
2. Check browser console for CORS errors
3. Check Network tab for Set-Cookie headers
4. Verify environment variables: `echo $NODE_ENV` on server
5. Test CORS with curl command from troubleshooting section

---

**Last Updated:** January 28, 2026
**Status:** Ready for production deployment
