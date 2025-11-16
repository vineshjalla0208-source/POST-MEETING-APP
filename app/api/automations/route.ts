import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("automations")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch automations" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      automations: data || [],
    })
  } catch (error: any) {
    console.error("Get automations error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch automations" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, type, prompt_template } = await request.json()

    if (!name || !type) {
      return NextResponse.json(
        { error: "name and type are required" },
        { status: 400 }
      )
    }

    if (!["email", "linkedin", "facebook"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'email', 'linkedin', or 'facebook'" },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Set defaults based on type
    let platform: string = "both"
    let tone: string = "warm financial advisor"
    let hashtag_count: number = 3

    if (type === "linkedin") {
      platform = "linkedin"
      tone = "professional and engaging financial advisor"
    } else if (type === "facebook") {
      platform = "facebook"
      tone = "warm and friendly financial advisor"
    }

    const { data, error } = await supabase
      .from("automations")
      .insert({
        user_id: session.user.id,
        name,
        type,
        platform,
        tone,
        hashtag_count,
        prompt_template: prompt_template || null,
        enabled: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Create automation error:", error)
      return NextResponse.json(
        { error: "Failed to create automation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      automation: data,
    })
  } catch (error: any) {
    console.error("Create automation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create automation" },
      { status: 500 }
    )
  }
}
