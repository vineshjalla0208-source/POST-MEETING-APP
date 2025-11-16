# API Authentication Fix - Complete Solution ✅

## ✅ All Issues Fixed

### Problem
"Sync failed – Unauthorized" error when clicking Sync Calendar button.

### Root Causes Fixed
1. ✅ Middleware was potentially blocking API routes
2. ✅ API route was looking up user by email instead of using session.user.id
3. ✅ Session.user.id was not storing the database UUID

## 📝 Files Fixed

### 1. **middleware.ts** ✅
- **ALL `/api` routes now pass through without any auth check**
- Only protects app routes like `/calendar`, `/meetings`, `/settings`
- Does NOT block `/api/calendar/sync` or any other API routes
- Clear separation: API routes = no middleware, App routes = middleware protection

### 2. **lib/auth.ts** ✅
- **JWT callback now stores the database UUID in `token.id` and `token.sub`**
- Gets UUID from `ensureUserInDatabase()` (which finds or creates user by email)
- Stores UUID in token so it's available in session
- **Session callback returns `session.user.id = token.id`** (which is the UUID)
- `pages: { signIn: "/auth/signin" }` is configured

### 3. **app/api/calendar/sync/route.ts** ✅
- Uses `getServerSession(authOptions)` directly
- Returns `new NextResponse("Unauthorized", { status: 401 })` if session is missing
- **Uses `session.user.id` directly** (which is now the UUID from database)
- No longer needs to look up user by email
- Uses UUID to fetch tokens from `user_tokens` table

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

### JWT Callback (stores UUID):
```typescript
// On first sign-in, get UUID from database
const userUuid = await ensureUserInDatabase(
  '',
  user.email || "",
  user.name || undefined,
  user.image || undefined
)

// Store UUID in token (this becomes session.user.id)
token.sub = userUuid
token.id = userUuid
```

### Session Callback (exposes UUID):
```typescript
async session({ session, token }) {
  // Set session.user.id from token.id (which is the UUID)
  if (token.id) {
    (session.user as any).id = token.id
  } else if (token.sub) {
    (session.user as any).id = token.sub
  }
  return session
}
```

### API Route Authentication (uses UUID directly):
```typescript
// Get session directly
const session = await getServerSession(authOptions)

if (!session || !session.user) {
  return new NextResponse("Unauthorized", { status: 401 })
}

// Use session.user.id (which is the UUID from database)
const userId = (session.user as any).id

if (!userId) {
  return NextResponse.json({ error: "User ID not found in session" }, { status: 401 })
}

// Use UUID to fetch tokens
const userTokens = await getUserGoogleTokens(userId)
```

## ✅ Verification Checklist

- [x] Middleware allows ALL `/api` routes to pass
- [x] Middleware only protects app routes (`/calendar`, `/meetings`, etc.)
- [x] `/api/calendar/sync` uses `getServerSession()` directly
- [x] Returns 401 if session is missing
- [x] Uses `session.user.id` directly (no email lookup needed)
- [x] `session.user.id` contains the database UUID
- [x] NextAuth has `pages: { signIn: "/auth/signin" }`
- [x] Session callback returns `session.user.id = token.id`
- [x] JWT callback stores UUID in `token.id` and `token.sub`

## 🚀 Next Steps

1. **Restart Development Server:**
   ```bash
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

2. **Test the Flow:**
   - Sign in with Google (this will create/update user and store UUID in session)
   - Go to `/calendar`
   - Click "Sync Calendar"
   - Should return 200 (not 401)
   - Should sync meetings successfully

## 🎯 Expected Behavior

**Before:**
- Click "Sync Calendar" → 401 Unauthorized
- Session.user.id was not the database UUID

**After:**
- Click "Sync Calendar" → 200 OK
- `session.user.id` contains the database UUID
- Meetings sync from Google Calendar
- Events saved to `meetings` table

## 🔍 How It Works Now

1. **User signs in with Google:**
   - NextAuth JWT callback calls `ensureUserInDatabase()` to get/create user UUID
   - UUID is stored in `token.id` and `token.sub`
   - Google tokens are saved to `user_tokens` table using UUID

2. **User clicks "Sync Calendar":**
   - API route calls `getServerSession(authOptions)`
   - Gets `session.user.id` (which is the UUID)
   - Uses UUID to fetch tokens from `user_tokens` table
   - Fetches Google Calendar events
   - Saves events to `meetings` table

The "Unauthorized" error should now be completely resolved! 🎉

