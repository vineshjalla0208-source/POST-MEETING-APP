# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   Create a `.env.local` file with all required variables (see README.md)

3. **Set Up Supabase Database**
   - Create a Supabase project
   - Run the SQL migration from `supabase/migrations/001_initial_schema.sql`
   - Copy your Supabase URL and keys to `.env.local`

4. **Configure OAuth Providers**
   - Google: Set up OAuth in Google Cloud Console
   - LinkedIn: Create app in LinkedIn Developers
   - Facebook: Create app in Facebook Developers

5. **Get API Keys**
   - OpenAI: Get API key from OpenAI platform
   - Recall.ai: Get API key from Recall.ai dashboard

6. **Run Development Server**
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following tables:
- `users` - User accounts
- `google_accounts` - Connected Google accounts (supports multiple per user)
- `events` - Calendar events/meetings
- `meeting_bots` - Recall.ai bot instances
- `transcripts` - Meeting transcripts
- `social_connections` - LinkedIn/Facebook OAuth connections
- `automations` - Automation templates
- `user_settings` - User preferences

## API Endpoints

All API routes are protected and require authentication.

### Calendar
- `POST /api/calendar/sync` - Sync Google Calendar events

### Recall.ai
- `POST /api/recall/join` - Join a meeting with bot
- `POST /api/recall/poll` - Check bot status
- `POST /api/recall/save-transcript` - Save transcript

### AI Generation
- `POST /api/ai/generate-email` - Generate follow-up email
- `POST /api/ai/generate-post` - Generate social media post

### Social Media
- `POST /api/social/linkedin-post` - Post to LinkedIn
- `POST /api/social/facebook-post` - Post to Facebook

### Settings & Automations
- `POST /api/settings` - Update user settings
- `POST /api/automations` - Create automation
- `PUT /api/automations/[id]` - Update automation
- `DELETE /api/automations/[id]` - Delete automation

## Cron Jobs

The cron job at `/api/cron/join-meetings` runs every 5 minutes to automatically join upcoming meetings. Configure it in Vercel dashboard.

## Troubleshooting

### Authentication Issues
- Make sure all OAuth redirect URLs are correctly configured
- Check that NEXTAUTH_SECRET is set
- Verify OAuth client IDs and secrets are correct

### Database Issues
- Ensure migration has been run
- Check Supabase connection strings
- Verify RLS policies if using Row Level Security

### API Issues
- Check API keys are valid
- Verify rate limits haven't been exceeded
- Check API endpoint URLs are correct

