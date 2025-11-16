import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AutomationsClient } from "@/components/automations-client"

export default async function AutomationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const supabase = createServerSupabaseClient()

  // Get automations
  const { data: automations } = await supabase
    .from("automations")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Automations</h1>
        <p className="text-muted-foreground">
          Create and manage automation templates for social media posts
        </p>
      </div>

      <AutomationsClient initialAutomations={automations || []} />
    </div>
  )
}

