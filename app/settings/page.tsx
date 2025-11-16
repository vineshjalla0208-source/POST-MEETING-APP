import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsClient } from "@/components/settings-client"
import { SocialConnectSection } from "@/components/social-connect-section"
import { AutomationList } from "@/components/automation-list"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const supabase = createServerSupabaseClient()

  // Get user settings
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  // Get social token connections
  const { data: socialTokens } = await supabase
    .from("social_tokens")
    .select("provider")
    .eq("user_id", session.user.id)

  // Get automations
  const { data: automations } = await supabase
    .from("automations")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  // Get Google accounts
  const { data: googleAccounts } = await supabase
    .from("google_accounts")
    .select("*")
    .eq("user_id", session.user.id)

  const linkedInConnected = socialTokens?.some((t) => t.provider === "linkedin") || false
  const facebookConnected = socialTokens?.some((t) => t.provider === "facebook") || false

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, integrations, and automations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Social Media Connections */}
        <SocialConnectSection
          initialLinkedInConnected={linkedInConnected}
          initialFacebookConnected={facebookConnected}
        />

        {/* Google Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>Manage your connected Google accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {googleAccounts && googleAccounts.length > 0 ? (
              <div className="space-y-2">
                {googleAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <span className="text-sm">{account.email}</span>
                    <span className="text-xs text-muted-foreground">Connected</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No Google accounts connected
              </p>
            )}
            <form action="/api/auth/signin/google" method="post">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Add Google Account
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Bot Settings */}
        <SettingsClient
          initialSettings={settings}
          botJoinMinutesBefore={settings?.bot_join_minutes_before || 5}
        />

        {/* Automations Manager - Full Width */}
        <div className="lg:col-span-2">
          <AutomationList initialAutomations={automations || []} />
        </div>
      </div>
    </div>
  )
}
