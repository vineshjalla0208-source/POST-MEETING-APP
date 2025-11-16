# Quick Start Guide - Authentication Fix

## 🚀 Immediate Steps

### 1. Update `.env.local`

Ensure these variables are set (no spaces around `=`):

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-min-32-chars
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Verify Google OAuth Settings

In Google Cloud Console:
- **Authorized JavaScript origins:** `http://localhost:3000`
- **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`

### 3. Restart Server

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### 4. Clear Browser Cookies

Clear all cookies for `localhost:3000`

### 5. Test Flow

1. Go to `http://localhost:3000/auth/signin`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Check `http://localhost:3000/api/auth/session` - should return user object
5. Check `http://localhost:3000/api/debug/session` - should show all data
6. Click "Sync Calendar" - should work without errors

## 🔍 Debugging

### Check Session
```
GET http://localhost:3000/api/auth/session
```

### Check Full Debug Info
```
GET http://localhost:3000/api/debug/session
```

### Check Terminal Logs

Look for these logs:
- `🔐 JWT Callback - First sign in`
- `✅ User ensured in database`
- `✅ Google tokens saved successfully`
- `📋 Session callback - User ID`

## ❌ Common Issues

### Session is null
- Check `NEXTAUTH_SECRET` is set and 32+ chars
- Check `NEXTAUTH_URL` is exactly `http://localhost:3000`
- Clear cookies and restart server

### "Google account not connected"
- Check `/api/debug/session` - see if tokens are in database
- Sign out and sign in again
- Check Supabase `user_tokens` table

### "Unauthorized"
- Check session exists: `/api/auth/session`
- Check `session.user.id` is not null
- Verify middleware is not blocking API routes

## 📚 Full Documentation

See `AUTHENTICATION_FIX_COMPLETE.md` for complete details.

