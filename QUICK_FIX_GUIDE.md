# Quick Fix Guide

## 🚀 Immediate Actions Required

### Step 1: Fix Your `.env.local` File

Open your `.env.local` file and ensure:
- **NO spaces** around `=` signs
- **NO quotes** around values  
- **NO trailing spaces** or line breaks in values

**❌ WRONG:**
```
NEXTAUTH_URL = "http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL = "https://xxx.supabase.co"
```

**✅ CORRECT:**
```
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
```

### Step 2: Validate Environment Variables

Run the validation script:
```bash
npm run validate-env
```

This will check for:
- Missing variables
- Spaces around `=` signs
- Quotes in values
- Trailing whitespace

### Step 3: Clear Next.js Cache

**PowerShell:**
```powershell
Remove-Item -Recurse -Force .next
```

**Bash/CMD:**
```bash
rm -rf .next
# or
rmdir /s .next
```

### Step 4: Restart Development Server

```bash
npm run dev
```

## ✅ What Was Fixed

1. **"supabaseUrl is required" error** - Fixed by adding validation
2. **Environment variable formatting** - All values are now trimmed
3. **Type errors** - Fixed `user.id` → uses generated user IDs
4. **Supabase client initialization** - Proper validation added
5. **NextAuth configuration** - Added secret and proper callbacks

## 📋 Required Environment Variables

Make sure these are in your `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
OPENAI_API_KEY=your-openai-key
RECALL_API_KEY=your-recall-key
CRON_SECRET=your-cron-secret
```

## 🔍 Troubleshooting

### Still getting "supabaseUrl is required"?
1. Check `.env.local` has no spaces around `=`
2. Restart your terminal/IDE
3. Clear `.next` folder
4. Run `npm run validate-env`

### Login still fails?
1. Check browser console for errors
2. Check server logs for detailed errors
3. Verify OAuth credentials are correct
4. Ensure redirect URLs match in OAuth provider settings

### TypeScript errors?
1. Restart TypeScript server in your IDE
2. Run `npm run build` to see all errors
3. Check `types/next-auth.d.ts` is included

## 📝 Files Changed

- ✅ `lib/auth.ts` - Fixed user ID generation and callbacks
- ✅ `lib/supabase/client.ts` - Added validation
- ✅ `lib/supabase/server.ts` - Added validation
- ✅ `types/next-auth.d.ts` - Added type definitions
- ✅ `tsconfig.json` - Updated to include types
- ✅ `package.json` - Added validation script

## 🎯 Expected Behavior After Fixes

1. Server starts without errors
2. No "supabaseUrl is required" error
3. Google OAuth sign-in works
4. User created in Supabase database
5. Session established correctly

