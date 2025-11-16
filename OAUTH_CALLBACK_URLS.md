# OAuth Callback URLs Configuration

## Google OAuth Callback URL

**NextAuth automatically creates this callback URL:**
```
http://localhost:3000/api/auth/callback/google
```

**In your Google Cloud Console OAuth 2.0 Client configuration, you MUST add:**
```
http://localhost:3000/api/auth/callback/google
```

## Verification Checklist

- [ ] Google Cloud Console → APIs & Services → Credentials
- [ ] Select your OAuth 2.0 Client ID
- [ ] Under "Authorized redirect URIs", add: `http://localhost:3000/api/auth/callback/google`
- [ ] Save the changes
- [ ] Ensure `NEXTAUTH_URL=http://localhost:3000` in your `.env.local` (no spaces, no quotes)

## Other Provider Callback URLs

**LinkedIn:**
```
http://localhost:3000/api/auth/callback/linkedin
```

**Facebook:**
```
http://localhost:3000/api/auth/callback/facebook
```

## Important Notes

1. The callback URL must **exactly match** what NextAuth expects
2. No trailing slashes
3. Use `http://` (not `https://`) for local development
4. Port must be `3000` (or match your dev server port)
5. The path is always `/api/auth/callback/[provider]`

