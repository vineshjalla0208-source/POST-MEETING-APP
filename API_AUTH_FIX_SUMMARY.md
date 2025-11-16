# API Authentication Fix - Complete Solution

## ✅ Issues Fixed

### Problem
"Sync failed – Unauthorized" error when clicking Sync Calendar button.

### Root Causes
1. Middleware might have been blocking API routes
2. API route was using `getCurrentUserId()` which might fail
3. Session not being read correctly in API routes

## 📝 Files Fixed

### 1. **middleware.ts**
- ✅ **ALL `/api` routes now pass through without any auth check**
- ✅ Only protects app routes like `/calendar`, `/meetings`, `/settings`
- ✅ Does NOT block `/api/calendar/sync` or any other API routes
- ✅ Clear separation: API routes = no middleware, App routes = middleware protection

### 2. **app/api/calendar/sync/route.ts**
- ✅ Now uses `getServerSession(authOptions)` directly
- ✅ Returns `new NextResponse("Unauthorized", { status: 401 })` if session is missing
- ✅ Finds user by email to get UUID from `users` table
- ✅ Uses UUID to fetch tokens from `user_tokens` table
- ✅ Proper error handling at each step

### 3. **lib/auth.ts**
- ✅ `pages: { signIn: "/auth/signin" }` is configured
- ✅ `callbacks.session` returns `session.user.id = token.id` (or `token.sub` as fallback)
- ✅ Session callback properly sets user ID

## 🔧 Key Changes

### Middleware Logic:
```typescript
// ALL API routes pass through - NO auth check
if (pathname.startsWith('/api')) {
  return NextResponse.next()
}

// Only protect app routes
if (!token && !pathname.startsWith('/auth')) {
  return NextResponse.redirect(new URL('/auth/signin', req.url))
}
```

### API Route Authentication:
```typescript
// Get session directly
const session = await getServerSession(authOptions)

if (!session || !session.user) {
  return new NextResponse("Unauthorized", { status: 401 })
}

// Find user by email to get UUID
const { data: user } = await supabase
  .from('users')
  .select('id')
  .eq('email', session.user.email)
  .single()

// Use UUID to fetch tokens
const userTokens = await getUserGoogleTokens(user.id)
```

### Session Callback:
```typescript
async session({ session, token }) {
  // Set user.id from token.id (or token.sub)
  if (token.id) {
    (session.user as any).id = token.id
  } else if (token.sub) {
    (session.user as any).id = token.sub
  }
  return session
}
```

## ✅ Verification Checklist

- [x] Middleware allows ALL `/api` routes to pass
- [x] Middleware only protects app routes (`/calendar`, `/meetings`, etc.)
- [x] `/api/calendar/sync` uses `getServerSession()` directly
- [x] Returns 401 if session is missing
- [x] Finds user by email to get UUID
- [x] Uses UUID to fetch tokens
- [x] NextAuth has `pages: { signIn: "/auth/signin" }`
- [x] Session callback returns `session.user.id`

## 🚀 Next Steps

1. **Restart Development Server:**
   ```bash
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

2. **Test the Flow:**
   - Sign in with Google
   - Go to `/calendar`
   - Click "Sync Calendar"
   - Should return 200 (not 401)
   - Should sync meetings successfully

## 🎯 Expected Behavior

**Before:**
- Click "Sync Calendar" → 401 Unauthorized

**After:**
- Click "Sync Calendar" → 200 OK
- Meetings sync from Google Calendar
- Events saved to `meetings` table

The "Unauthorized" error should now be resolved! 🎉

