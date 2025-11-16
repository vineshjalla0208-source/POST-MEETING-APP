# POST-MEETING-APP

A Next.js application that automatically syncs Google Calendar meetings, records transcripts using Recall.ai, and generates AI-powered social media content.

## Features

- 🔐 **NextAuth Authentication** - Google OAuth integration
- 📅 **Google Calendar Sync** - Automatic meeting detection
- 🎙️ **Recall.ai Integration** - Automated meeting transcription
- 🤖 **AI Content Generation** - Generate follow-up emails and social posts
- 📱 **Social Media Posting** - Direct posting to LinkedIn and Facebook
- 💾 **Supabase Database** - PostgreSQL with Row Level Security

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** NextAuth.js
- **Styling:** TailwindCSS + Shadcn UI
- **APIs:** Google Calendar API, Recall.ai API, OpenAI API

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud Console project with OAuth credentials
- Recall.ai API key (optional)
- OpenAI API key (optional)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vineshjalla0208-source/POST-MEETING-APP.git
   cd POST-MEETING-APP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your actual values in `.env.local`:
   - Supabase URL and keys
   - Google OAuth credentials
   - NextAuth secret
   - API keys (OpenAI, Recall.ai)

4. **Set up database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the migration: `supabase/migrations/20250101_initial.sql`
   - Or run: `supabase/schema.sql` and `supabase/policies.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### Tables

- **users** - User accounts
- **accounts** - OAuth provider accounts (Google, LinkedIn, Facebook)
- **meetings** - Calendar meetings
- **transcripts** - Meeting transcripts
- **summary_cache** - Cached AI summaries

See `supabase/schema.sql` for complete schema definition.

## Project Structure

```
post-meeting-app/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth routes
│   │   ├── calendar/     # Calendar sync
│   │   ├── meetings/     # Meeting management
│   │   └── transcripts/  # Transcript handling
│   ├── auth/             # Authentication pages
│   ├── meetings/         # Meeting pages
│   └── page.tsx          # Home page
├── components/           # React components
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase clients
│   ├── auth.ts           # NextAuth config
│   └── google-calendar.ts # Calendar utilities
├── supabase/
│   ├── migrations/       # Database migrations
│   ├── schema.sql        # Complete schema
│   └── policies.sql      # RLS policies
└── public/               # Static assets
```

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# APIs (Optional)
OPENAI_API_KEY=your-openai-key
RECALL_API_KEY=your-recall-key
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Add required scopes in OAuth consent screen:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events.readonly`
   - `https://www.googleapis.com/auth/calendar.calendarlist.readonly`

## API Routes

### Calendar Sync
- `POST /api/calendar/sync` - Sync Google Calendar events

### Meetings
- `GET /api/meetings` - Get user meetings
- `GET /api/meetings/[id]` - Get meeting details
- `POST /api/meetings` - Create meeting

### Transcripts
- `GET /api/transcripts/[id]` - Get transcript
- `POST /api/transcripts` - Save transcript

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run validate-google-oauth` - Validate OAuth configuration

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
