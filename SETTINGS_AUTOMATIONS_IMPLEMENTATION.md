# Settings Page + Automations Manager - Complete Implementation

## ✅ Implementation Summary

All components for Settings Page + Automations Manager have been implemented and are ready to use.

## 📋 Files Created/Modified

### Database Migrations
- ✅ `supabase/migrations/005_settings_automations.sql` - Creates `social_tokens` table and updates `automations` table

### API Routes - Social Media OAuth
- ✅ `app/api/social/linkedin/connect/route.ts` - Save LinkedIn OAuth tokens
- ✅ `app/api/social/facebook/connect/route.ts` - Save Facebook OAuth tokens
- ✅ `app/api/social/linkedin/post/route.ts` - Post to LinkedIn
- ✅ `app/api/social/facebook/post/route.ts` - Post to Facebook
- ✅ `app/api/social/linkedin/status/route.ts` - Check LinkedIn connection status
- ✅ `app/api/social/facebook/status/route.ts` - Check Facebook connection status
- ✅ `app/api/social/linkedin/disconnect/route.ts` - Disconnect LinkedIn
- ✅ `app/api/social/facebook/disconnect/route.ts` - Disconnect Facebook

### API Routes - Automations
- ✅ `app/api/automations/route.ts` - GET (list) and POST (create) automations
- ✅ `app/api/automations/[id]/route.ts` - GET, PUT (update), DELETE automations

### API Routes - Updated
- ✅ `app/api/ai/automation/route.ts` - Updated to use automations table with prompt templates

### UI Components
- ✅ `components/automation-form.tsx` - Modal form for creating/editing automations
- ✅ `components/automation-list.tsx` - List view with edit/delete actions
- ✅ `components/social-connect-section.tsx` - LinkedIn/Facebook connection UI
- ✅ `components/ui/dialog.tsx` - Dialog component (shadcn/ui)
- ✅ `components/ui/select.tsx` - Select component (shadcn/ui)

### Pages
- ✅ `app/settings/page.tsx` - Complete settings page with all features

### Library Files
- ✅ `lib/supabase/social-tokens.ts` - Helper functions for social token management
- ✅ `lib/auth.ts` - Updated to save LinkedIn/Facebook tokens on OAuth

## 🗄️ Database Schema

### `social_tokens` Table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- provider ('linkedin' | 'facebook')
- access_token (text)
- refresh_token (text, nullable)
- expires_at (bigint, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
- UNIQUE(user_id, provider)
```

### `automations` Table (Updated)
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- name (text)
- type ('email' | 'linkedin' | 'facebook' | 'generate_post')
- platform ('linkedin' | 'facebook' | 'both')
- tone (text)
- hashtag_count (integer, 0-10)
- prompt_template (text, nullable) - NEW
- enabled (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)
```

## 🚀 Setup Instructions

### 1. Run Database Migration

Execute the migration in your Supabase SQL editor:
```sql
-- Run: supabase/migrations/005_settings_automations.sql
```

### 2. Verify Environment Variables

Ensure your `.env.local` has:
```env
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 3. OAuth App Configuration

#### LinkedIn:
1. Go to LinkedIn Developer Portal
2. Create an app
3. Add redirect URL: `http://localhost:3000/api/auth/callback/linkedin`
4. Request scopes: `r_emailaddress`, `r_liteprofile`, `w_member_social`

#### Facebook:
1. Go to Facebook Developers
2. Create an app
3. Add redirect URL: `http://localhost:3000/api/auth/callback/facebook`
4. Request permissions: `email`, `public_profile`, `pages_manage_posts`, `pages_read_engagement`

## 📡 API Endpoints

### Social Media OAuth

#### `POST /api/social/linkedin/connect`
Save LinkedIn OAuth tokens after authentication.

**Body:**
```json
{
  "access_token": "string",
  "refresh_token": "string (optional)",
  "expires_at": "number (optional)"
}
```

#### `POST /api/social/facebook/connect`
Save Facebook OAuth tokens after authentication.

**Body:**
```json
{
  "access_token": "string",
  "refresh_token": "string (optional)",
  "expires_at": "number (optional)"
}
```

#### `POST /api/social/linkedin/post`
Post content to LinkedIn.

**Body:**
```json
{
  "text": "Post content here"
}
```

#### `POST /api/social/facebook/post`
Post content to Facebook.

**Body:**
```json
{
  "text": "Post content here",
  "page_id": "string (optional)"
}
```

#### `GET /api/social/linkedin/status`
Check if LinkedIn is connected.

#### `GET /api/social/facebook/status`
Check if Facebook is connected.

#### `POST /api/social/linkedin/disconnect`
Disconnect LinkedIn account.

#### `POST /api/social/facebook/disconnect`
Disconnect Facebook account.

### Automations

#### `GET /api/automations`
Get all automations for the current user.

**Response:**
```json
{
  "success": true,
  "automations": [...]
}
```

#### `POST /api/automations`
Create a new automation.

**Body:**
```json
{
  "name": "Automation Name",
  "type": "email" | "linkedin" | "facebook",
  "prompt_template": "Custom prompt with {transcript}, {tone}, {hashtag_count} variables (optional)"
}
```

#### `GET /api/automations/[id]`
Get a specific automation.

#### `PUT /api/automations/[id]`
Update an automation.

**Body:**
```json
{
  "name": "Updated Name (optional)",
  "type": "email" | "linkedin" | "facebook" (optional),
  "prompt_template": "Updated template (optional)",
  "enabled": true | false (optional)
}
```

#### `DELETE /api/automations/[id]`
Delete an automation.

## 🎨 UI Features

### Settings Page Layout

**Two-Column Grid:**
1. **Left Column:**
   - Social Media Connections (LinkedIn + Facebook)
   - Google Calendar Accounts
   - Bot Settings

2. **Right Column:**
   - Automations Manager (Full Width)

### Social Connect Section
- ✅ LinkedIn connection button
- ✅ Facebook connection button
- ✅ Connection status badges
- ✅ Disconnect functionality
- ✅ Real-time status checking

### Automation Manager
- ✅ Add Automation button
- ✅ List all automations
- ✅ Edit automation (modal)
- ✅ Delete automation (with confirmation)
- ✅ Display automation type, status, and custom template badge
- ✅ Empty state with helpful message

### Automation Form Modal
- ✅ Name input
- ✅ Type selector (Email, LinkedIn, Facebook)
- ✅ Prompt template textarea with variable hints
- ✅ Create/Update functionality
- ✅ Form validation

## 🔄 Workflow

### 1. Connect Social Media
1. User clicks "Connect LinkedIn" or "Connect Facebook"
2. NextAuth OAuth flow initiates
3. User authorizes app
4. Tokens saved to `social_tokens` table via NextAuth callback
5. Connection status updated in UI

### 2. Create Automation
1. User clicks "Add Automation"
2. Modal opens with form
3. User fills in name, type, and optional prompt template
4. Automation saved to database
5. List refreshes automatically

### 3. Generate Content from Automation
1. User navigates to meeting detail page
2. Clicks "Generate All" in Automation Posts section
3. System fetches all enabled automations
4. For each automation:
   - If custom `prompt_template` exists, uses it with variable substitution
   - Otherwise, uses default generation
   - Generates content based on automation type
   - Saves to `ai_posts` table
5. Posts displayed in UI

### 4. Post to Social Media
1. User generates or views a social post
2. Clicks "Post to LinkedIn" or "Post to Facebook"
3. System fetches access token from `social_tokens`
4. Posts to respective platform API
5. Success/error feedback shown

## ✅ Acceptance Criteria - All Met

### OAuth Connections
- ✅ LinkedIn OAuth sign-in button in settings
- ✅ Facebook OAuth sign-in button in settings
- ✅ Access tokens saved to `social_tokens` table
- ✅ Refresh tokens saved (when available)
- ✅ LinkedIn scope: `r_emailaddress r_liteprofile w_member_social`
- ✅ Facebook scope: `pages_manage_posts pages_read_engagement`
- ✅ API endpoints for connecting and posting

### Automations Manager
- ✅ Settings page at `/settings`
- ✅ Add Automation modal with name, type, prompt_template
- ✅ List automations
- ✅ Edit automation
- ✅ Delete automation
- ✅ Full CRUD operations

### Automation Execution
- ✅ `/api/ai/automation` loads all user automations
- ✅ Generates posts based on each automation
- ✅ Supports custom prompt templates with variables
- ✅ Stores generated posts in `ai_posts` table
- ✅ Handles email, LinkedIn, and Facebook types

### UI Components
- ✅ AutomationForm component
- ✅ AutomationList component
- ✅ SocialConnectSection component
- ✅ SettingsLayout (integrated in settings page)

## 🎯 Features

### Custom Prompt Templates
Automations support custom prompt templates with variables:
- `{transcript}` - Meeting transcript content
- `{tone}` - Automation tone setting
- `{hashtag_count}` - Number of hashtags

Example:
```
Create a LinkedIn post based on this transcript: {transcript}
Use a {tone} tone with {hashtag_count} hashtags.
```

### Token Management
- Automatic token saving on OAuth login
- Token expiration checking
- Secure storage in Supabase
- Disconnect functionality

### Automation Types
- **Email**: Generates follow-up emails
- **LinkedIn**: Generates LinkedIn posts
- **Facebook**: Generates Facebook posts

### Error Handling
- Graceful error handling throughout
- User-friendly error messages
- Toast notifications for feedback
- Connection status validation

## 📝 Notes

- NextAuth automatically saves LinkedIn/Facebook tokens on OAuth login
- Custom prompt templates are optional - defaults are used if not provided
- Automation types determine the platform and default settings
- All automations are user-scoped (RLS policies)
- Social tokens are automatically saved via NextAuth JWT callback

## 🔐 Security

- Row Level Security (RLS) enabled on `social_tokens` table
- User-scoped queries (users can only access their own data)
- Token validation before posting
- Secure token storage in Supabase

