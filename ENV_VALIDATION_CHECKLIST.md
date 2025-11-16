# .env.local Validation Checklist

## ✅ Manual Check Instructions

Since `.env.local` is in `.gitignore`, please manually verify the following:

### 1. NEXTAUTH_URL Format

**✅ CORRECT:**
```env
NEXTAUTH_URL=http://localhost:3000
```

**❌ WRONG (common mistakes):**
```env
NEXTAUTH_URL = http://localhost:3000          # Has spaces around =
NEXTAUTH_URL="http://localhost:3000"          # Has quotes
NEXTAUTH_URL=http://localhost:3000/            # Has trailing slash
NEXTAUTH_URL = "http://localhost:3000"        # Has both spaces and quotes
```

**Checklist:**
- [ ] No spaces before or after `=`
- [ ] No quotes around the value
- [ ] No trailing slash
- [ ] Exactly `http://localhost:3000` (not `https://`, not port 3001, etc.)

---

### 2. NEXTAUTH_SECRET

**✅ CORRECT:**
```env
NEXTAUTH_SECRET=your-secret-here-at-least-32-characters
```

**❌ WRONG:**
```env
NEXTAUTH_SECRET = "your-secret"                # Has spaces and quotes
NEXTAUTH_SECRET=your-secret                    # Too short (should be 32+ chars)
```

**Checklist:**
- [ ] Variable exists
- [ ] No spaces around `=`
- [ ] No quotes
- [ ] At least 32 characters long (recommended)

---

### 3. Google OAuth Credentials

**✅ CORRECT:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

**❌ WRONG:**
```env
GOOGLE_CLIENT_ID = "123456789..."              # Has spaces and quotes
GOOGLE_CLIENT_SECRET = GOCSPX-...              # Has spaces
```

**Checklist:**
- [ ] `GOOGLE_CLIENT_ID` exists
- [ ] `GOOGLE_CLIENT_SECRET` exists
- [ ] No spaces around `=`
- [ ] No quotes around values
- [ ] No leading/trailing spaces in values

---

### 4. Supabase Variables

**✅ CORRECT:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**❌ WRONG:**
```env
NEXT_PUBLIC_SUPABASE_URL = "https://..."       # Has spaces and quotes
NEXT_PUBLIC_SUPABASE_ANON_KEY= eyJhbG...      # Has leading space
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...            # Has trailing space
```

**Checklist:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` exists
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` exists
- [ ] `SUPABASE_SERVICE_ROLE_KEY` exists
- [ ] No spaces around `=`
- [ ] No quotes around values
- [ ] No leading/trailing spaces in values

---

## 🔍 How to Check for Spaces

1. Open `.env.local` in a text editor
2. Enable "Show Whitespace" or "Show Invisibles"
3. Look for spaces before/after `=` signs
4. Look for spaces at the start/end of values

**Visual Example:**
```
✅ CORRECT:
NEXTAUTH_URL=http://localhost:3000

❌ WRONG (spaces shown as ·):
NEXTAUTH_URL·=·http://localhost:3000
NEXTAUTH_URL=http://localhost:3000·
NEXTAUTH_URL·=·"http://localhost:3000"
```

---

## 📋 Google OAuth Callback URL

**NextAuth automatically uses this callback URL:**
```
http://localhost:3000/api/auth/callback/google
```

**In Google Cloud Console, you MUST add this EXACT URL:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Click **Save**

**Important:**
- Must be `http://` (not `https://`) for local development
- Must be port `3000`
- Must be exactly `/api/auth/callback/google`
- No trailing slash

---

## 🧪 Run Validation Script

After checking manually, run the validation script:

```bash
npm run validate-env-local
```

This will check:
- All required variables exist
- NEXTAUTH_URL format is correct
- No spaces or quotes in values
- Google OAuth credentials exist
- Supabase variables exist and have no spaces

---

## ✅ Final Checklist

Before running the app, verify:

- [ ] NEXTAUTH_URL=http://localhost:3000 (exact, no spaces, no quotes, no slash)
- [ ] NEXTAUTH_SECRET exists and is 32+ characters
- [ ] GOOGLE_CLIENT_ID exists (no spaces/quotes)
- [ ] GOOGLE_CLIENT_SECRET exists (no spaces/quotes)
- [ ] NEXT_PUBLIC_SUPABASE_URL exists (no leading/trailing spaces)
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY exists (no leading/trailing spaces)
- [ ] SUPABASE_SERVICE_ROLE_KEY exists (no leading/trailing spaces)
- [ ] Google OAuth callback URL is configured in Google Cloud Console

---

## 🚨 Common Issues

### Issue: "supabaseUrl is required"
**Solution:** Check that `NEXT_PUBLIC_SUPABASE_URL` has no spaces/quotes

### Issue: AccessDenied error
**Solution:** 
- Verify NEXTAUTH_URL is exactly `http://localhost:3000`
- Verify Google callback URL matches in Google Cloud Console
- Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct

### Issue: Environment variables not loading
**Solution:**
- Restart your development server after changing `.env.local`
- Clear `.next` folder: `Remove-Item -Recurse -Force .next`
- Ensure no spaces around `=` signs

