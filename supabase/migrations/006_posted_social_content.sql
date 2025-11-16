-- Migration: Posted Social Content Table
-- Stores records of content posted to social media platforms

-- TABLE: posted_social_content
-- Stores all content posted to LinkedIn and Facebook
CREATE TABLE IF NOT EXISTS posted_social_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook')),
  content TEXT NOT NULL,
  post_id TEXT, -- External post ID from LinkedIn/Facebook
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  ai_post_id UUID REFERENCES ai_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posted_social_content_user_id ON posted_social_content(user_id);
CREATE INDEX IF NOT EXISTS idx_posted_social_content_platform ON posted_social_content(platform);
CREATE INDEX IF NOT EXISTS idx_posted_social_content_meeting_id ON posted_social_content(meeting_id);
CREATE INDEX IF NOT EXISTS idx_posted_social_content_created_at ON posted_social_content(created_at);

-- RLS Policies
ALTER TABLE posted_social_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own posted content" ON posted_social_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posted content" ON posted_social_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posted content" ON posted_social_content
  FOR DELETE USING (auth.uid() = user_id);

