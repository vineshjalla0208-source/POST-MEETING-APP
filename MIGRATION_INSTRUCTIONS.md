# Database Migration Instructions

## Option 1: Run in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/ALL_MIGRATIONS_COMBINED.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute all migrations

## Option 2: Run Individual Migrations

If you prefer to run migrations one at a time:

1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order:
   - `001_initial_schema.sql`
   - `002_google_calendar_sync.sql`
   - `003_recall_integration.sql`
   - `004_ai_posts.sql`
   - `005_settings_automations.sql`
   - `006_posted_social_content.sql`

## Option 3: Use Supabase CLI (If Linked)

If you have Supabase CLI linked to your project:

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

## Verification

After running migrations, verify tables were created:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- `users`
- `google_accounts`
- `events`
- `meetings`
- `user_tokens`
- `recall_bots`
- `transcripts`
- `social_connections`
- `social_tokens`
- `automations`
- `user_settings`
- `ai_posts`
- `posted_social_content`

## Notes

- The combined migration file uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times
- RLS (Row Level Security) policies are enabled for user-scoped tables
- All tables have proper indexes for performance
- Triggers are set up for automatic `updated_at` timestamps

