# Supabase Auth + Google Calendar Implementation

## Overview
This implementation replaces NextAuth with Supabase Auth for Google OAuth and adds a complete calendar management system.

## Files Created/Modified

### Authentication
- `lib/supabase/auth.ts` - Helper functions for Supabase Auth
- `app/api/auth/google/route.ts` - Initiates Google OAuth flow
- `app/api/auth/callback/route.ts` - Handles OAuth callback, saves user and tokens
- `app/api/auth/logout/route.ts` - Handles user logout
- `app/auth/signin/page.tsx` - Sign in page
- `components/signin-client-supabase.tsx` - Sign in client component
- `middleware.ts` - Protects routes and redirects unauthenticated users

### Calendar Management
- `app/api/calendar/sync/route.ts` - Syncs Google Calendar events
- `app/api/calendar/toggle-recall/route.ts` - Toggles Recall bot for meetings
- `app/calendar/page.tsx` - Calendar page showing upcoming meetings
- `components/calendar-client.tsx` - Client component for calendar UI

### Updated Files
- `components/nav.tsx` - Updated to use Supabase Auth
- `app/layout.tsx` - Updated to use Supabase Auth
- `app/page.tsx` - Updated to use Supabase Auth

## Setup Instructions

### 1. Supabase Configuration
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Client ID: From Google Cloud Console
   - Client Secret: From Google Cloud Console
5. Add redirect URL: `http://localhost:3000/api/auth/callback`
6. Add scopes: `openid email profile https://www.googleapis.com/auth/calendar.readonly`

### 2. Environment Variables
Ensure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Database Setup
Run the `ALL_MIGRATIONS_COMBINED.sql` file in your Supabase SQL Editor to create all required tables.

## Features

### 1. Google OAuth Login
- Users sign in with Google via Supabase Auth
- User data is automatically saved to `users` table
- Google tokens are saved to `user_tokens` table

### 2. Calendar Sync
- Click "Sync Calendar" to fetch all Google Calendar events
- Events are saved to `meetings` table
- Platform detection (Zoom, Google Meet, Teams)
- Meeting URL extraction

### 3. Recall Bot Toggle
- Toggle "Send Recall bot to this meeting" for each meeting
- Saves `notetaker_enabled` status in `meetings` table
- Disabled for past meetings

### 4. Calendar Page
- Lists all upcoming meetings
- Shows meeting details (title, time, platform, URL)
- Real-time toggle updates
- Sync button to refresh calendar

## API Routes

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/callback` - Handle OAuth callback
- `POST /api/auth/logout` - Sign out user

### Calendar
- `POST /api/calendar/sync` - Sync Google Calendar events
- `POST /api/calendar/toggle-recall` - Toggle Recall bot for a meeting

## Database Tables Used

- `users` - User accounts
- `user_tokens` - OAuth tokens (Google access/refresh tokens)
- `meetings` - Calendar events/meetings

## Next Steps

1. Test the Google OAuth flow
2. Sync calendar events
3. Toggle Recall bot for meetings
4. Implement Recall bot creation when meeting starts

