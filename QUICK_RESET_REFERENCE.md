# Quick Google OAuth Reset Reference

## 🚀 Quick Start (5 Steps)

### 1. Validate Configuration
```bash
npm run validate-google-oauth
```

### 2. Reset Supabase Database
Run in Supabase SQL Editor:
```sql
DELETE FROM public.accounts WHERE provider = 'google';
```

### 3. Revoke Google Account Access
- Go to: https://myaccount.google.com/security
- Click: **Third-party apps with account access**
- Find your app → **Remove access**

### 4. Update Google Cloud Console
- **Redirect URI:** `http://localhost:3000/api/auth/callback/google`
- **Scopes:** Add all calendar scopes in OAuth consent screen

### 5. Re-authenticate
- Sign out of app
- Sign in with Google
- Grant calendar permissions

---

## ✅ Verification Checklist

- [ ] Configuration validated (`npm run validate-google-oauth`)
- [ ] Old tokens deleted from Supabase
- [ ] App access revoked in Google Account
- [ ] Redirect URI correct in Google Cloud Console
- [ ] Calendar scopes added in OAuth consent screen
- [ ] Signed in again with Google
- [ ] New token has calendar scopes

---

## 📍 Your Redirect URI

```
http://localhost:3000/api/auth/callback/google
```

**Must be EXACTLY this in Google Cloud Console!**

---

## 🔍 Verify Token Scopes

After re-authentication, check in Supabase:

```sql
SELECT scope FROM public.accounts 
WHERE provider = 'google' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Should include:**
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`

---

## 📚 Full Guide

See `GOOGLE_OAUTH_RESET_GUIDE.md` for detailed step-by-step instructions.

