# NextAuth SupabaseAdapter Configuration - Complete

## ✅ Changes Applied

### 1. Installed Required Package

```bash
npm install @auth/supabase-adapter
```

### 2. Updated NextAuth Route

**File:** `app/api/auth/[...nextauth]/route.ts`

**Key Changes:**
- ✅ Added `SupabaseAdapter` from `@auth/supabase-adapter`
- ✅ Created Supabase client with service role key
- ✅ Configured adapter to use `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Added manual token saving in `jwt` callback to `public.accounts`
- ✅ Added Google Calendar scopes for calendar sync
- ✅ Proper error handling and logging

---

## 📋 Configuration Details

### SupabaseAdapter Setup

```typescript
adapter: SupabaseAdapter({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})
```

**Note:** The adapter will automatically:
- Create users in `public.users` table
- Save accounts to `public.accounts` table
- Handle sessions (though we're using JWT strategy)

### Manual Token Saving

The `jwt` callback also manually saves tokens to ensure they're stored correctly:

```typescript
async jwt({ token, account, user }) {
  if (account?.provider === "google" && account?.access_token) {
    await supabase.from("accounts").upsert({
      user_id: user?.id ?? token.sub,
      provider: "google",
      provider_account_id: account.providerAccountId,
      access_token: account.access_token,
      refresh_token: account.refresh_token || null,
      expires_at: account.expires_at ? account.expires_at * 1000 : null, // Convert to milliseconds
      token_type: account.token_type || null,
      scope: account.scope || null,
      id_token: account.id_token || null,
    }, {
      onConflict: 'provider,provider_account_id',
    })
  }
  return token
}
```

**Why manual save?**
- Ensures tokens are saved even if adapter has issues
- Converts `expires_at` from seconds to milliseconds (matches our schema)
- Includes all token fields (token_type, scope, id_token)

### Google Provider Configuration

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
      access_type: "offline",  // Required for refresh tokens
      prompt: "consent",        // Ensures refresh token is returned
    },
  },
})
```

---

## 🔧 Environment Variables Required

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

---

## ✅ How It Works

1. **User signs in with Google:**
   - NextAuth handles OAuth flow
   - SupabaseAdapter creates/updates user in `public.users`
   - SupabaseAdapter saves account to `public.accounts`

2. **JWT Callback:**
   - Manually saves tokens to `public.accounts` (ensures all fields are saved)
   - Converts `expires_at` from seconds to milliseconds
   - Handles errors gracefully

3. **Session Callback:**
   - Sets `session.user.id` from `token.sub`
   - Returns session with user ID

---

## 🧪 Testing

### Step 1: Restart Server

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Step 2: Sign In

1. Go to `http://localhost:3000/auth/signin`
2. Click "Sign in with Google"
3. Complete OAuth flow

### Step 3: Check Terminal Logs

You should see:
```
✅ Google tokens saved to public.accounts
```

### Step 4: Verify Database

```sql
-- Check public.accounts table
SELECT 
  id,
  user_id,
  provider,
  provider_account_id,
  CASE WHEN access_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_access_token,
  CASE WHEN refresh_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_refresh_token,
  expires_at,
  created_at
FROM public.accounts
WHERE provider = 'google';

-- Check public.users table
SELECT id, email, name FROM public.users;
```

---

## 🐛 Troubleshooting

### Issue: "SupabaseAdapter is not a function"

**Fix:**
- Ensure `@auth/supabase-adapter` is installed: `npm install @auth/supabase-adapter`
- Check package.json for the package

### Issue: "SUPABASE_SERVICE_ROLE_KEY is missing"

**Fix:**
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- Get it from Supabase Dashboard → Settings → API → Service Role Key

### Issue: Tokens not saving

**Check:**
1. Terminal logs for errors
2. Database permissions (RLS policies)
3. Service role key has correct permissions

**Fix:**
- Ensure service role key bypasses RLS
- Check terminal for specific error messages

### Issue: "user.id is undefined"

**Fix:**
- The adapter should create the user first
- Check `public.users` table for the user
- Verify `token.sub` is set correctly

---

## 📝 Notes

1. **Dual Token Saving:**
   - SupabaseAdapter saves tokens automatically
   - Manual save in jwt callback ensures all fields are saved correctly
   - This redundancy ensures tokens are always saved

2. **JWT Strategy:**
   - We're using JWT strategy (not database sessions)
   - Sessions are stored in JWT tokens, not database
   - Accounts are still saved to database for API access

3. **Token Expiration:**
   - `expires_at` is converted from seconds (OAuth) to milliseconds (database)
   - This matches our `BIGINT` schema

---

**Status:** ✅ Complete  
**NextAuth Configuration:** Using SupabaseAdapter + Manual Token Save  
**Token Storage:** `public.accounts` table

