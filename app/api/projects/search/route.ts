import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const category = searchParams.get("category")
    const role = searchParams.get("role")

    if (!query && !category && !role) {
      return NextResponse.json(
        {
          success: false,
          error: "No search parameters provided",
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    let projectsQuery = supabase.from("projects").select("*")

    // Apply filters
    if (query) {
      projectsQuery = projectsQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,role.ilike.%${query}%`,
      )
    }

    if (category) {
      projectsQuery = projectsQuery.eq("category", category)
    }

    if (role) {
      projectsQuery = projectsQuery.ilike("role", `%${role}%`)
    }

    const { data, error } = await projectsQuery.order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching projects:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to search projects",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      query,
      category,
      role,
    })
  } catch (error) {
    console.error("Error in search API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
