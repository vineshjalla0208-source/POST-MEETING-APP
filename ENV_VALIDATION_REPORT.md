# .env.local Validation Report

## ✅ Validation Tools Created

I've created validation tools to help you check your `.env.local` file:

### 1. Automated Validation Script

**Run this command:**
```bash
npm run validate-env-local
```

This script will:
- ✅ Check if NEXTAUTH_URL is exactly `http://localhost:3000`
- ✅ Verify NEXTAUTH_SECRET exists
- ✅ Verify Google OAuth credentials exist
- ✅ Check Supabase variables for leading/trailing spaces
- ✅ Detect common formatting issues (spaces, quotes, etc.)

### 2. Manual Checklist

See `ENV_VALIDATION_CHECKLIST.md` for a detailed manual checklist.

---

## 📋 What to Check in Your .env.local

### 1. NEXTAUTH_URL

**Must be exactly:**
```env
NEXTAUTH_URL=http://localhost:3000
```

**Common mistakes to avoid:**
- ❌ `NEXTAUTH_URL = http://localhost:3000` (spaces around =)
- ❌ `NEXTAUTH_URL="http://localhost:3000"` (quotes)
- ❌ `NEXTAUTH_URL=http://localhost:3000/` (trailing slash)
- ❌ `NEXTAUTH_URL=https://localhost:3000` (https instead of http)

### 2. NEXTAUTH_SECRET

**Format:**
```env
NEXTAUTH_SECRET=your-secret-here-minimum-32-characters
```

**Check:**
- [ ] Variable exists
- [ ] No spaces around `=`
- [ ] No quotes
- [ ] At least 32 characters (recommended)

### 3. Google OAuth

**Format:**
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

**Check:**
- [ ] Both variables exist
- [ ] No spaces around `=`
- [ ] No quotes around values
- [ ] No leading/trailing spaces in values

### 4. Supabase Variables

**Format:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Check:**
- [ ] All three variables exist
- [ ] No spaces around `=`
- [ ] No quotes around values
- [ ] No leading/trailing spaces in values (critical!)

---

## 🔗 Google OAuth Callback URL

**NextAuth automatically uses this callback URL:**
```
http://localhost:3000/api/auth/callback/google
```

**In Google Cloud Console, verify:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Under **Authorized redirect URIs**, ensure this EXACT URL exists:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

**Important:**
- Must be `http://` (not `https://`) for local development
- Must be port `3000`
- Must be exactly `/api/auth/callback/google`
- No trailing slash

---

## 🧪 How to Validate

### Option 1: Run Automated Script

```bash
npm install  # Install dotenv if not already installed
npm run validate-env-local
```

### Option 2: Manual Check

1. Open `.env.local` in a text editor
2. Enable "Show Whitespace" or "Show Invisibles"
3. Check each variable against the checklist above
4. Look for:
   - Spaces before/after `=`
   - Quotes around values
   - Leading/trailing spaces in values
   - Trailing slashes

### Option 3: Visual Inspection

**Correct format:**
```
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
```

**Incorrect format (spaces shown as ·):**
```
NEXTAUTH_URL·=·http://localhost:3000
GOOGLE_CLIENT_ID·=·"123456789..."
NEXT_PUBLIC_SUPABASE_URL·=·https://xxxxx.supabase.co·
```

---

## ✅ Quick Validation Checklist

Before running your app, verify:

- [ ] `NEXTAUTH_URL=http://localhost:3000` (exact, no spaces, no quotes, no slash)
- [ ] `NEXTAUTH_SECRET` exists (32+ characters, no spaces/quotes)
- [ ] `GOOGLE_CLIENT_ID` exists (no spaces/quotes)
- [ ] `GOOGLE_CLIENT_SECRET` exists (no spaces/quotes)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` exists (no leading/trailing spaces)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` exists (no leading/trailing spaces)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` exists (no leading/trailing spaces)
- [ ] Google OAuth callback URL configured in Google Cloud Console

---

## 🚨 Common Issues & Solutions

### Issue: "supabaseUrl is required"
**Cause:** `NEXT_PUBLIC_SUPABASE_URL` has spaces or is missing
**Solution:** Remove spaces around `=`, ensure no quotes, check for trailing spaces

### Issue: AccessDenied error
**Cause:** NEXTAUTH_URL mismatch or Google callback URL not configured
**Solution:** 
- Verify NEXTAUTH_URL is exactly `http://localhost:3000`
- Verify Google callback URL in Google Cloud Console

### Issue: Environment variables not loading
**Cause:** Formatting issues or server not restarted
**Solution:**
- Fix formatting (remove spaces/quotes)
- Clear `.next` folder: `Remove-Item -Recurse -Force .next`
- Restart dev server: `npm run dev`

---

## 📝 Next Steps

1. **Run the validation script:**
   ```bash
   npm run validate-env-local
   ```

2. **Fix any issues found**

3. **Verify Google OAuth callback URL** in Google Cloud Console

4. **Clear cache and restart:**
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

---

**Note:** Since `.env.local` is in `.gitignore`, I cannot read it directly. Use the validation script or manual checklist above to verify your configuration.

