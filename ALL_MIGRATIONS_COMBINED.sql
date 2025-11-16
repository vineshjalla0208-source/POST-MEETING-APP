CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_account_id UUID REFERENCES google_accounts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  meeting_link TEXT,
  meeting_platform TEXT CHECK (meeting_platform IN ('zoom', 'meet', 'teams')),
  location TEXT,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'recording', 'completed', 'failed')),
  recall_bot_id TEXT,
  joined_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'both')),
  tone TEXT NOT NULL,
  hashtag_count INTEGER NOT NULL DEFAULT 3 CHECK (hashtag_count >= 0 AND hashtag_count <= 10),
  type TEXT NOT NULL DEFAULT 'generate_post' CHECK (type IN ('generate_post', 'email', 'linkedin', 'facebook')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  prompt_template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bot_join_minutes_before INTEGER NOT NULL DEFAULT 5 CHECK (bot_join_minutes_before >= 0 AND bot_join_minutes_before <= 60),
  default_automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  profile_id TEXT,
  profile_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google', 'linkedin', 'facebook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  meeting_url TEXT,
  platform TEXT DEFAULT 'unknown' CHECK (platform IN ('zoom', 'google', 'teams', 'unknown')),
  notetaker_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, google_event_id)
);

CREATE TABLE IF NOT EXISTS recall_bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  recall_bot_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joining', 'recording', 'processing', 'completed', 'failed')),
  meeting_url TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  meeting_bot_id UUID REFERENCES meeting_bots(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  recall_bot_id UUID REFERENCES recall_bots(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attendees TEXT[] DEFAULT '{}',
  duration_minutes INTEGER,
  summary TEXT,
  duration_seconds INTEGER,
  participant_count INTEGER,
  participants TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'linkedin', 'facebook', 'automation')),
  content TEXT NOT NULL,
  automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
  platform TEXT CHECK (platform IN ('linkedin', 'facebook', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('linkedin', 'facebook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE TABLE IF NOT EXISTS posted_social_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook')),
  content TEXT NOT NULL,
  post_id TEXT,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  ai_post_id UUID REFERENCES ai_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_accounts_user_id ON google_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_meeting_bots_event_id ON meeting_bots(event_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_event_id ON transcripts(event_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_provider ON user_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_google_event_id ON meetings(google_event_id);
CREATE INDEX IF NOT EXISTS idx_meetings_notetaker_enabled ON meetings(notetaker_enabled);
CREATE INDEX IF NOT EXISTS idx_recall_bots_meeting_id ON recall_bots(meeting_id);
CREATE INDEX IF NOT EXISTS idx_recall_bots_recall_bot_id ON recall_bots(recall_bot_id);
CREATE INDEX IF NOT EXISTS idx_recall_bots_status ON recall_bots(status);
CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_recall_bot_id ON transcripts(recall_bot_id);
CREATE INDEX IF NOT EXISTS idx_ai_posts_meeting_id ON ai_posts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_ai_posts_type ON ai_posts(type);
CREATE INDEX IF NOT EXISTS idx_ai_posts_automation_id ON ai_posts(automation_id);
CREATE INDEX IF NOT EXISTS idx_ai_posts_created_at ON ai_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_social_tokens_user_id ON social_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_social_tokens_provider ON social_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_posted_social_content_user_id ON posted_social_content(user_id);
CREATE INDEX IF NOT EXISTS idx_posted_social_content_platform ON posted_social_content(platform);
CREATE INDEX IF NOT EXISTS idx_posted_social_content_meeting_id ON posted_social_content(meeting_id);
CREATE INDEX IF NOT EXISTS idx_posted_social_content_created_at ON posted_social_content(created_at);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_user_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_recall_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_transcripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_ai_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_social_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_accounts_updated_at BEFORE UPDATE ON google_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_bots_updated_at BEFORE UPDATE ON meeting_bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON transcripts
  FOR EACH ROW EXECUTE FUNCTION update_transcripts_updated_at();

CREATE TRIGGER update_social_connections_updated_at BEFORE UPDATE ON social_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tokens_updated_at 
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW EXECUTE FUNCTION update_user_tokens_updated_at();

CREATE TRIGGER update_meetings_updated_at 
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_meetings_updated_at();

CREATE TRIGGER update_recall_bots_updated_at 
  BEFORE UPDATE ON recall_bots
  FOR EACH ROW EXECUTE FUNCTION update_recall_bots_updated_at();

CREATE TRIGGER update_ai_posts_updated_at 
  BEFORE UPDATE ON ai_posts
  FOR EACH ROW EXECUTE FUNCTION update_ai_posts_updated_at();

CREATE TRIGGER update_social_tokens_updated_at 
  BEFORE UPDATE ON social_tokens
  FOR EACH ROW EXECUTE FUNCTION update_social_tokens_updated_at();

ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own social tokens" ON social_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social tokens" ON social_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social tokens" ON social_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social tokens" ON social_tokens
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE posted_social_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own posted content" ON posted_social_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posted content" ON posted_social_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posted content" ON posted_social_content
  FOR DELETE USING (auth.uid() = user_id);
