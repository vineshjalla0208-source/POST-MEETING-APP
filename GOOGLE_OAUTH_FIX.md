# Google OAuth Fix Summary

## Issues Found

1. **Conflicting Auth Systems**: Both NextAuth and Supabase Auth routes exist
2. **Missing `force-dynamic` export**: NextAuth route handler needs this for Next.js 14
3. **Incorrect sign-in method**: Component was calling Supabase route instead of NextAuth
4. **Redirect callback**: Needed better handling for callback URLs

## Files Fixed

### 1. `/app/api/auth/[...nextauth]/route.ts`
- ✅ Added `export const dynamic = "force-dynamic"` for Next.js 14 App Router
- ✅ Ensured GET and POST handlers are properly exported

### 2. `/components/signin-client-supabase.tsx`
- ✅ Changed from calling `/api/auth/google` (Supabase route) to using NextAuth's `signIn('google')`
- ✅ Added proper error handling
- ✅ Set callbackUrl to `/calendar`

### 3. `/lib/auth.ts`
- ✅ Improved redirect callback to handle relative paths and same-origin URLs
- ✅ Google provider configuration is correct with proper scopes

### 4. `/app/auth/signin/page.tsx`
- ✅ Changed from Supabase auth check to NextAuth `getServerSession`

## Environment Variables Required

Ensure your `.env.local` has:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Google Cloud Console Configuration

Make sure these are set:
- **Authorized JavaScript origins**: `http://localhost:3000`
- **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

## Next Steps

1. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Clear Next.js cache
   Remove-Item -Recurse -Force .next
   # Start server
   npm run dev
   ```

2. **Test the sign-in flow**:
   - Go to `http://localhost:3000/auth/signin`
   - Click "Sign in with Google"
   - Should redirect to Google OAuth
   - After authorization, should redirect back to `/calendar`

3. **If errors persist**:
   - Check browser console for errors
   - Check terminal for server errors
   - Verify `.env.local` has all required variables
   - Verify Google Cloud Console redirect URI matches exactly

## What Changed

### Before:
- Sign-in component called `/api/auth/google` (Supabase route)
- NextAuth route handler missing `force-dynamic`
- Redirect callback too restrictive

### After:
- Sign-in component uses NextAuth's `signIn('google')` function
- NextAuth route handler has `force-dynamic` export
- Redirect callback properly handles callback URLs
- All auth checks use NextAuth consistently

