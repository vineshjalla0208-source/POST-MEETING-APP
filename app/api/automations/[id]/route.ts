import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("automations")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      automation: data,
    })
  } catch (error: any) {
    console.error("Get automation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch automation" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, type, prompt_template, enabled } = await request.json()

    const supabase = createServerSupabaseClient()

    // Verify automation belongs to user
    const { data: existing, error: checkError } = await supabase
      .from("automations")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) {
      if (!["email", "linkedin", "facebook"].includes(type)) {
        return NextResponse.json(
          { error: "type must be 'email', 'linkedin', or 'facebook'" },
          { status: 400 }
        )
      }
      updateData.type = type

      // Update platform based on type
      if (type === "linkedin") {
        updateData.platform = "linkedin"
        updateData.tone = "professional and engaging financial advisor"
      } else if (type === "facebook") {
        updateData.platform = "facebook"
        updateData.tone = "warm and friendly financial advisor"
      } else {
        updateData.platform = "both"
        updateData.tone = "warm financial advisor"
      }
    }
    if (prompt_template !== undefined) updateData.prompt_template = prompt_template
    if (enabled !== undefined) updateData.enabled = enabled

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("automations")
      .update(updateData)
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .select()
      .single()

    if (error) {
      console.error("Update automation error:", error)
      return NextResponse.json(
        { error: "Failed to update automation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      automation: data,
    })
  } catch (error: any) {
    console.error("Update automation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update automation" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Verify automation belongs to user
    const { data: existing, error: checkError } = await supabase
      .from("automations")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from("automations")
      .delete()
      .eq("id", params.id)
      .eq("user_id", session.user.id)

    if (error) {
      console.error("Delete automation error:", error)
      return NextResponse.json(
        { error: "Failed to delete automation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Automation deleted successfully",
    })
  } catch (error: any) {
    console.error("Delete automation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete automation" },
      { status: 500 }
    )
  }
}
